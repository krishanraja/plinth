import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <header className="border-b border-hairline bg-background/70 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 font-mono text-xs">
        <Link to="/" className="flex items-center gap-2">
          <span className="dot" aria-hidden />
          <span className="font-display text-xl text-foreground">plinth</span>
          <span className="ml-2 text-muted-foreground hidden sm:inline">/ product data for agents</span>
        </Link>
        <nav className="hidden items-center gap-7 text-muted-foreground md:flex">
          <Link to="/docs" className="hover:text-foreground">docs</Link>
          <a href="/#pricing" className="hover:text-foreground">pricing</a>
          <Link to="/docs/mcp" className="hover:text-foreground">mcp</Link>
          {user ? (
            <Link to="/dashboard" className="rounded-sm border border-hairline px-3 py-1.5 text-foreground hover:border-signal hover:text-signal">
              dashboard
            </Link>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="rounded-sm bg-signal px-3 py-1.5 text-background hover:opacity-90"
            >
              sign in
            </button>
          )}
        </nav>
      </div>
      <AuthModal open={open} onOpenChange={setOpen} />
    </header>
  );
}
