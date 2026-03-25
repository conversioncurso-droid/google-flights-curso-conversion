interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 font-[family-name:var(--font-manrope)] ${variantStyles[variant]}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
