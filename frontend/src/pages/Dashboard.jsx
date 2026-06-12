import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Megaphone, Send, MousePointerClick, Eye, Zap } from "lucide-react";
import { getOverview, getCampaigns } from "../lib/api";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getCampaigns()])
      .then(([ov, camp]) => {
        setOverview(ov);
        setCampaigns(camp.campaigns?.slice(0, 5) || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 bg-brand-orange rounded-full" />
          <h1 className="text-xl font-bold">Welcome back</h1>
        </div>
        <p className="text-sm text-brand-muted pl-3.5">
          Here's what's happening with your BiteLoop campaigns.
        </p>
      </div>

      {/* CTA Banner */}
      <Link
        to="/chat"
        className="block card mb-6 border-brand-orange/30 bg-gradient-to-r from-brand-orange/10 to-transparent
                   hover:border-brand-orange/60 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-orange/20 rounded-lg group-hover:bg-brand-orange/30 transition-colors">
            <Zap size={18} className="text-brand-orange" />
          </div>
          <div>
            <div className="font-semibold text-sm text-brand-text">AI Campaign Builder</div>
            <div className="text-xs text-brand-muted">
              Describe your audience in plain English → AI builds the segment and drafts your message
            </div>
          </div>
          <div className="ml-auto text-brand-orange text-sm font-medium group-hover:translate-x-1 transition-transform">
            Try it →
          </div>
        </div>
      </Link>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-brand-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Customers" value={overview?.totalCustomers?.toLocaleString()} icon={Users} color="blue" />
          <StatCard label="Campaigns Sent" value={overview?.totalCampaigns} icon={Megaphone} color="orange" />
          <StatCard label="Messages Sent" value={overview?.totalSent?.toLocaleString()} icon={Send} color="green" />
          <StatCard label="Open Rate" value={`${overview?.openRate ?? 0}%`} icon={Eye} color="yellow" />
        </div>
      )}

      {/* Delivery funnel */}
      {overview && (
        <div className="card mb-6">
          <div className="text-sm font-semibold mb-4">Delivery Funnel</div>
          <div className="flex items-end gap-2 h-24">
            {[
              { label: "Sent", value: overview.totalSent, color: "bg-brand-muted" },
              { label: "Delivered", value: overview.delivered, color: "bg-blue-500" },
              { label: "Opened", value: overview.opened, color: "bg-brand-orange" },
              { label: "Clicked", value: overview.clicked, color: "bg-brand-yellow" },
            ].map((bar) => {
              const pct = overview.totalSent ? (bar.value / overview.totalSent) * 100 : 0;
              return (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-mono text-brand-muted">{bar.value}</div>
                  <div className="w-full flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-md ${bar.color} transition-all`}
                      style={{ height: `${Math.max(pct, 4)}px`, maxHeight: "64px", minHeight: "4px" }}
                    />
                  </div>
                  <div className="text-[10px] text-brand-muted text-center">{bar.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Recent Campaigns</div>
          <Link to="/campaigns" className="text-xs text-brand-orange hover:underline">View all →</Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-brand-muted text-sm">
            No campaigns yet.{" "}
            <Link to="/chat" className="text-brand-orange hover:underline">Create your first one →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-brand-surface transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-brand-muted">
                    {c.stats?.sent || 0} sent · {c.stats?.opened || 0} opened
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
