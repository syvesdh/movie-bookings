// Tiny uppercase label, optionally preceded by a short decorative rule.
export function Overline({
  children,
  rule = false,
  className = "",
}: {
  children: React.ReactNode;
  rule?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {rule && <span className="h-px w-8 bg-[#1a1a1a]/40 md:w-12" />}
      <span className="overline">{children}</span>
    </span>
  );
}
