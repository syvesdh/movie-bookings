import { forwardRef } from "react";

// Underline-only input with an italic serif placeholder (editorial feel).
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", id, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={id} className="overline">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`h-12 border-b border-[#1a1a1a] bg-transparent px-0 py-2 text-sm text-[#1a1a1a] outline-none transition-colors duration-500 placeholder:font-serif placeholder:italic placeholder:text-[#6c6863] focus-visible:border-[#d4af37] ${className}`}
          {...rest}
        />
      </div>
    );
  },
);
Input.displayName = "Input";
