import clsx from "clsx";

export default function StatCard({ label, value, sub, icon: Icon, color = "orange", trend }) {
  const colors = {
    orange: "text-brand-orange bg-brand-orange/10",
    green: "text-green-400 bg-green-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    yellow: "text-yellow-400 bg-yellow-400/10",
    red: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="card flex items-start justify-between gap-4 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-muted font-medium uppercase tracking-wide mb-1">{label}</div>
        <div className="text-2xl font-bold text-brand-text">{value ?? "—"}</div>
        {sub && <div className="text-xs text-brand-muted mt-0.5">{sub}</div>}
        {trend !== undefined && (
          <div className={clsx("text-xs mt-1 font-medium", trend >= 0 ? "text-green-400" : "text-red-400")}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      {Icon && (
        <div className={clsx("p-2.5 rounded-lg flex-shrink-0", colors[color])}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
