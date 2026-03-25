import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
}

const variants = {
  primary:
    "bg-primary text-white hover:bg-deep disabled:opacity-50",
  secondary:
    "bg-background text-text border border-border hover:bg-border/30 disabled:opacity-50",
  danger:
    "bg-danger text-white hover:bg-danger/80 disabled:opacity-50",
  ghost:
    "text-text-muted hover:text-text hover:bg-background disabled:opacity-50",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
