import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-white text-black placeholder-black/40 px-4 py-3.5 text-[15px] outline-none outline-offset-2 focus:outline-2 focus:outline-white/70 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`label-loose block text-[11px] text-muted mb-2 ${props.className ?? ""}`}
    />
  );
}
