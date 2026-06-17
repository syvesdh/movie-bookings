// Editorial card: defined by a single top border (not a full box), with a
// subtle shadow that deepens on hover. `featured` uses a thick gold top border.
interface CardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

export function Card({ children, className = "", featured = false }: CardProps) {
  const border = featured
    ? "border-t-4 border-t-[#d4af37]"
    : "border-t border-t-[#1a1a1a]";
  return (
    <div
      className={`group ${border} bg-transparent p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-700 ease-out hover:bg-[#f9f8f6]/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-12 ${className}`}
    >
      {children}
    </div>
  );
}
