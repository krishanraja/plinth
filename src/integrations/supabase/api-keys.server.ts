// Server-only API-key helpers. The .server.ts suffix keeps this out of the client bundle.
// Keys are shown once at creation; only the SHA-256 hash is stored (key_hash is service-role-only).
import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// plk_ + 24 random bytes (base64url). Returned in full ONCE; we persist only the hash.
export function generateKeyMaterial() {
  const secret = randomBytes(24).toString("base64url");
  const key = `plk_${secret}`;
  return { key, prefix: key.slice(0, 12), last_four: key.slice(-4), key_hash: hashKey(key) };
}

// Validate a presented key: hash -> lookup non-revoked -> touch last_used_at. Returns the principal or null.
export async function validateApiKey(
  presented: string | null,
): Promise<{ userId: string; keyId: string } | null> {
  if (!presented || !presented.startsWith("plk_")) return null;
  const key_hash = hashKey(presented);
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", key_hash)
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data) return null;
  void supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return { userId: data.user_id, keyId: data.id };
}
