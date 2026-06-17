import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "link";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-10 px-6",
  md: "h-12 px-8",
  lg: "h-14 px-10",
};

const base =
  "relative inline-flex items-center justify-center overflow-hidden text-xs font-medium uppercase tracking-[0.2em] transition-all duration-500 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a1a1a]";

function classesFor(variant: Variant, size: Size) {
  if (variant === "link") {
    return "group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#1a1a1a] transition-colors duration-500 hover:text-[#d4af37]";
  }
  if (variant === "secondary") {
    return `${base} ${sizes[size]} border border-[#1a1a1a] bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f9f8f6]`;
  }
  // primary
  return `${base} ${sizes[size]} bg-[#1a1a1a] text-[#f9f8f6] shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]`;
}

// The gold layer that slides in from the left on primary hover.
function PrimaryInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="absolute inset-0 -translate-x-full bg-[#d4af37] transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-0" />
      <span className="relative z-10">{children}</span>
    </>
  );
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...rest }, ref) => {
    const cls = `${classesFor(variant, size)} ${variant === "primary" ? "group" : ""} ${className}`;
    return (
      <button ref={ref} className={cls} {...rest}>
        {variant === "primary" ? <PrimaryInner>{children}</PrimaryInner> : children}
      </button>
    );
  },
);
Button.displayName = "Button";

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: ButtonLinkProps) {
  const cls = `${classesFor(variant, size)} ${variant === "primary" ? "group" : ""} ${className}`;
  return (
    <Link href={href} className={cls}>
      {variant === "primary" ? <PrimaryInner>{children}</PrimaryInner> : children}
    </Link>
  );
}
