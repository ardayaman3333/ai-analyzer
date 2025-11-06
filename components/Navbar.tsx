/* components/Navbar.tsx */

import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo / Brand */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold sm:inline-block">NexusAI Analyzer</span>
        </Link>

        {/* Menü Linkleri */}
        <nav className="flex items-center gap-4 text-sm lg:gap-6">
          <Link href="/analyses" className="text-muted-foreground transition-colors hover:text-foreground">
            Analyses
          </Link>
        </nav>
      </div>
    </header>
  );
}

