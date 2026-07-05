import { createFileRoute } from "@tanstack/react-router";
import { postOnly } from "@/lib/api/http";
import { createHmac, timingSafeEqual } from "node:crypto";

/* eslint-disable @typescript-eslint/no-explicit-any -- Stripe webhook event payloads are dynamic untyped JSON */

// Stripe webhook. Verifies the signature manually (no SDK), then mirrors subscriptions + invoices.

function verifySignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // Reject events older than 5 minutes (replay protection).
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

const SUB_STATUS = new Set(["trialing", "active", "past_due", "canceled", "incomplete"]);
function mapStatus(s: string): string {
  if (SUB_STATUS.has(s)) return s;
  if (s === "unpaid") return "past_due";
  return "canceled";
}

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function upsertSubscription(admin: AdminClient, userId: string, sub: Record<string, any>) {
  const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
  let planId = "free";
  if (priceId) {
    const { data: plan } = await admin.from("plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
    if (plan?.id) planId = plan.id;
  }
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: mapStatus(String(sub.status)),
      stripe_customer_id: sub.customer ?? null,
      stripe_subscription_id: sub.id ?? null,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    },
    { onConflict: "user_id" },
  );
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      ...postOnly,
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const sk = process.env.STRIPE_SECRET_KEY;
        if (!secret || !sk) return new Response("billing not configured", { status: 503 });

        const raw = await request.text();
        if (!verifySignature(raw, request.headers.get("stripe-signature"), secret)) {
          return new Response("bad signature", { status: 400 });
        }

        let event: { type?: string; data?: { object?: Record<string, any> } };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("bad payload", { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const obj = event.data?.object ?? {};
          switch (event.type) {
            case "checkout.session.completed": {
              const userId = (obj.client_reference_id as string) ?? obj.metadata?.user_id;
              if (userId && obj.subscription) {
                const sub = (await (
                  await fetch(`https://api.stripe.com/v1/subscriptions/${obj.subscription}`, {
                    headers: { authorization: `Bearer ${sk}` },
                  })
                ).json()) as Record<string, any>;
                await upsertSubscription(supabaseAdmin, userId, sub);
              }
              break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const userId = obj.metadata?.user_id as string | undefined;
              if (userId) await upsertSubscription(supabaseAdmin, userId, obj);
              break;
            }
            case "invoice.paid":
            case "invoice.payment_failed": {
              const { data: sub } = await supabaseAdmin
                .from("subscriptions")
                .select("user_id")
                .eq("stripe_customer_id", obj.customer)
                .maybeSingle();
              if (sub?.user_id) {
                await supabaseAdmin.from("invoices").upsert(
                  {
                    user_id: sub.user_id,
                    stripe_invoice_id: obj.id,
                    amount_cents: (obj.amount_paid ?? obj.amount_due ?? 0) as number,
                    currency: (obj.currency as string) ?? "usd",
                    status: (obj.status as string) ?? "open",
                    hosted_url: (obj.hosted_invoice_url as string) ?? null,
                    pdf_url: (obj.invoice_pdf as string) ?? null,
                    period_start: obj.period_start ? new Date(obj.period_start * 1000).toISOString() : null,
                    period_end: obj.period_end ? new Date(obj.period_end * 1000).toISOString() : null,
                  },
                  { onConflict: "stripe_invoice_id" },
                );
              }
              break;
            }
          }
        } catch (e) {
          console.error("[stripe webhook]", e);
        }
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
