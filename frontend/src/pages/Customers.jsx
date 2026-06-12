import { useEffect, useState } from "react";
import { Search, Users, MapPin, ShoppingBag } from "lucide-react";
import { getCustomers, getCustomerStats } from "../lib/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomers({ limit: 200 }), getCustomerStats()])
      .then(([c, s]) => {
        setCustomers(c.customers || []);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const daysSince = (dateStr) => {
    if (!dateStr) return "—";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} shoppers in your base`}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total?.toLocaleString()} icon={Users} color="blue" />
          <StatCard label="Active (30d)" value={stats.active} icon={Users} color="green" />
          <StatCard label="Avg. Spend" value={`₹${stats.avgSpend?.toLocaleString()}`} icon={ShoppingBag} color="orange" />
          <StatCard
            label="Top City"
            value={Object.entries(stats.cities || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
            icon={MapPin}
            color="yellow"
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          className="input pl-9 text-sm"
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {["Name", "City", "Orders", "Total Spend", "Fav Item", "Last Order"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-brand-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-brand-surface rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((c) => (
                  <tr key={c.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text">{c.name}</div>
                      <div className="text-xs text-brand-muted">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{c.city}</td>
                    <td className="px-4 py-3 text-brand-text font-mono">{c.orderCount}</td>
                    <td className="px-4 py-3 text-brand-text font-mono">₹{c.totalSpend?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs">{c.favouriteItem}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs">{daysSince(c.lastOrderDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-2 border-t border-brand-border text-xs text-brand-muted">
            Showing 100 of {filtered.length} customers
          </div>
        )}
      </div>
    </div>
  );
}
