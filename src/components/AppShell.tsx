"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: "/blog", label: "Blog" },
      { href: "/socials", label: "Socials" },
      { href: "/chat", label: "Chat" },
      { href: "/account", label: "Account" },
    ],
    [],
  );

  const menuLinks = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/blog", label: "Blog" },
      { href: "/socials", label: "Socials" },
      { href: "/chat", label: "Chat" },
      { href: "/account", label: "Account" },
    ],
    [],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setMobileOpen(false);
      setMenuOpen(false);
    });
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <div className="min-h-full flex flex-col cyber-bg grid-overlay">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close site menu" : "Open site menu"}
                aria-expanded={menuOpen}
              >
                Menu
                <span className="text-xs">▾</span>
              </button>

              {menuOpen ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-2xl border border-white/10 bg-black/85 p-2 shadow-cyber-soft backdrop-blur-xl">
                  {menuLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={
                        isActive(item.href)
                          ? "block rounded-xl px-3 py-2 text-sm text-white bg-white/10"
                          : "block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link href="/" className="font-semibold tracking-tight text-white text-xl md:text-2xl">
              <span className="text-white">Cyde</span>
              <span className="text-[color:var(--cyber)]">Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-2 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    isActive(l.href)
                      ? "rounded-full px-3 py-2 text-white bg-white/10 border border-white/10 backdrop-blur-xl shadow-cyber-soft"
                      : "rounded-full px-3 py-2 text-white/80 border border-white/10 bg-white/5 backdrop-blur-xl shadow-cyber-soft hover:text-white hover:bg-white/10"
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/80 transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-white/10">
            <div className="mx-auto w-full max-w-6xl px-4 py-3 flex flex-col gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    isActive(l.href)
                      ? "rounded-2xl px-4 py-3 text-white bg-white/10 border border-white/10 backdrop-blur-xl shadow-cyber-soft"
                      : "rounded-2xl px-4 py-3 text-white/80 border border-white/10 bg-white/5 backdrop-blur-xl shadow-cyber-soft hover:text-white hover:bg-white/10"
                  }
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="font-semibold tracking-tight text-white">
                <span className="text-white">Cyde</span>
                <span className="text-[color:var(--cyber)]">Hub</span>
              </div>
              <div className="mt-2 text-sm text-white/60">
                Community chat, stories, and updates for players.
              </div>
              <div className="mt-4 text-xs text-white/50">Big ideas. Fast shipping.</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Explore</div>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link className="text-white/70 hover:text-white" href="/">
                  Home
                </Link>
                <Link className="text-white/70 hover:text-white" href="/blog">
                  Blog
                </Link>
                <Link className="text-white/70 hover:text-white" href="/account">
                  Account
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Community</div>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link className="text-white/70 hover:text-white" href="/chat">
                  Chat
                </Link>
                <Link className="text-white/70 hover:text-white" href="/blog">
                  Blog
                </Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Status</div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Authentication ready
                </div>
                <div className="text-xs text-white/50">Sign in to access account and chat features.</div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
            © {new Date().getFullYear()} CydeHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
