import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[#1a1a1a]/15">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-6 md:px-16">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-serif text-2xl tracking-tight md:text-3xl">
            Cinéma
          </span>
          <span className="hidden h-px w-8 bg-[#1a1a1a]/40 md:block" />
          <span className="overline hidden md:block">Editorial Vol. 01</span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/"
            className="overline transition-colors duration-500 hover:text-[#d4af37]"
          >
            Now Showing
          </Link>
          <span className="overline hidden text-[#6c6863] sm:block">
            Est. 2026
          </span>
        </nav>
      </div>
    </header>
  );
}
