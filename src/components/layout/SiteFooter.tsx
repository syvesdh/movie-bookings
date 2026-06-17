export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[#1a1a1a]/15">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-8 py-12 md:flex-row md:items-end md:justify-between md:px-16">
        <div>
          <p className="font-serif text-3xl md:text-4xl">
            Reserve with <span className="italic text-[#d4af37]">intention.</span>
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6c6863]">
            A curated cinema experience. No two patrons share a seat — every
            reservation is held, considered, and confirmed.
          </p>
        </div>
        <p className="overline text-[#6c6863]">
          © 2026 Cinéma — Editorial Booking
        </p>
      </div>
    </footer>
  );
}
