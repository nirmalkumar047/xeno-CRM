import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { getOverview, getTrends } from "../lib/api";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { TrendingUp, Mail, Eye, MousePointerClick } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-3 text-xs">
      <div className="font-medium mb-1 text-brand-text">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getTrends()])
      .then(([ov, tr]) => {
        setOverview(ov);
        setTrends(tr.trends?.reverse() || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const funnelData = overview
    ? [
        { name: "Sent", value: overview.totalSent },
        { name: "Delivered", value: overview.delivered },
        { name: "Opened", value: overview.opened },
        { name: "Clicked", value: overview.clicked },
      ]
    : [];

  return (
    <div className="p-6">
      <PageHeader title="Analytics" subtitle="Campaign performance overview" />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-32" />)}
        </div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Delivery Rate" value={`${overview?.deliveryRate ?? 0}%`} icon={Mail} color="blue" />
            <StatCard label="Open Rate" value={`${overview?.openRate ?? 0}%`} icon={Eye} color="orange" />
            <StatCard label="Click Rate" value={`${overview?.clickRate ?? 0}%`} icon={MousePointerClick} color="yellow" />
            <StatCard label="Total Campaigns" value={overview?.totalCampaigns} icon={TrendingUp} color="green" />
          </div>

          {/* Funnel chart */}
          <div className="card mb-6">
            <div className="text-sm font-semibold mb-4">Overall Delivery Funnel</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#FF5C00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trends */}
          {trends.length > 1 && (
            <div className="card mb-6">
              <div className="text-sm font-semibold mb-4">Open Rate Trend by Campaign</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.slice(0, 12)}
                  />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="openRate"
                    stroke="#FF5C00"
                    strokeWidth={2}
                    dot={{ fill: "#FF5C00", r: 4 }}
                    name="Open Rate %"
                  />
                  <Line
                    type="monotone"
                    dataKey="clickRate"
                    stroke="#FFE500"
                    strokeWidth={2}
                    dot={{ fill: "#FFE500", r: 4 }}
                    name="Click Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaign table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-brand-border text-sm font-semibold">
              Campaign Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {["Campaign", "Sent", "Delivered", "Opened", "Clicked", "Open Rate", "Click Rate"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trends.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-brand-muted text-sm">
                        No campaign data yet
                      </td>
                    </tr>
                  ) : (
                    trends.map((t) => (
                      <tr key={t.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                        <td className="px-4 py-3 font-medium truncate max-w-[160px]">{t.name}</td>
                        <td className="px-4 py-3 font-mono text-brand-muted">{t.sent}</td>
                        <td className="px-4 py-3 font-mono text-blue-400">{t.delivered}</td>
                        <td className="px-4 py-3 font-mono text-brand-orange">{t.opened}</td>
                        <td className="px-4 py-3 font-mono text-yellow-400">{t.clicked}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-brand-surface rounded-full h-1.5">
                              <div className="bg-brand-orange rounded-full h-1.5" style={{ width: `${t.openRate}%` }} />
                            </div>
                            <span className="text-xs font-mono text-brand-muted w-8">{t.openRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-brand-surface rounded-full h-1.5">
                              <div className="bg-yellow-400 rounded-full h-1.5" style={{ width: `${t.clickRate}%` }} />
                            </div>
                            <span className="text-xs font-mono text-brand-muted w-8">{t.clickRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
