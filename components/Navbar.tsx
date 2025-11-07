"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/analyses", label: "Analyses" },
];

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="rounded-full bg-white/10 p-2 shadow-inner shadow-sky-500/30">
            <span className="text-lg font-black text-white">NX</span>
          </div>
          <div>
            <p className="bg-gradient-to-r from-sky-300 via-indigo-200 to-pink-200 bg-clip-text text-lg font-semibold text-transparent">
              NexusAI
            </p>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Analyzer</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border px-4 py-1.5 transition ${
                isActive(link.href)
                  ? "border-white text-white shadow-inner shadow-white/30"
                  : "border-white/10 text-slate-300 hover:border-white/40 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
