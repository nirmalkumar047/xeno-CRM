import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Send, Eye, MousePointerClick, XCircle, CheckCircle } from "lucide-react";
import { getCampaignAnalytics, sendCampaign } from "../lib/api";
import StatusBadge from "../components/ui/StatusBadge";

export default function CampaignDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getCampaignAnalytics(id);
      setData(res);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Auto-refresh if campaign is sending
    const interval = setInterval(() => {
      if (data?.campaign?.status === "sending" || data?.campaign?.status === "sent") {
        load(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [load, data?.campaign?.status]);

  const handleSend = async () => {
    if (!confirm("Send this campaign now?")) return;
    setSending(true);
    try {
      await sendCampaign(id);
      await load(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}
    </div>
  );

  if (!data) return (
    <div className="p-6">
      <div className="text-brand-muted">Campaign not found</div>
    </div>
  );

  const { campaign, messages, statusBreakdown, totalMessages } = data;
  const stats = campaign.stats || {};

  const deliveryRate = stats.sent ? Math.round(((stats.delivered || 0) / stats.sent) * 100) : 0;
  const openRate = stats.delivered ? Math.round(((stats.opened || 0) / stats.delivered) * 100) : 0;
  const clickRate = stats.opened ? Math.round(((stats.clicked || 0) / stats.opened) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl">
      {/* Back */}
      <Link to="/campaigns" className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{campaign.name}</h1>
          <div className="text-sm text-brand-muted mt-0.5">{campaign.subject}</div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={campaign.status} />
            {campaign.sentAt && (
              <span className="text-xs text-brand-muted">
                Sent {new Date(campaign.sentAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {campaign.status === "draft" && (
            <button onClick={handleSend} disabled={sending} className="btn-primary text-xs flex items-center gap-1.5">
              <Send size={12} /> {sending ? "Sending..." : "Send Now"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sent", value: stats.sent || 0, icon: Send, color: "text-brand-muted" },
          { label: "Delivered", value: stats.delivered || 0, sub: `${deliveryRate}%`, icon: CheckCircle, color: "text-blue-400" },
          { label: "Opened", value: stats.opened || 0, sub: `${openRate}%`, icon: Eye, color: "text-brand-orange" },
          { label: "Clicked", value: stats.clicked || 0, sub: `${clickRate}%`, icon: MousePointerClick, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <s.icon size={16} className={`${s.color} mx-auto mb-2`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-brand-muted">{s.label}</div>
            {s.sub && <div className={`text-xs font-medium mt-0.5 ${s.color}`}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Message body preview */}
      <div className="card mb-6">
        <div className="text-xs font-medium text-brand-muted uppercase tracking-wide mb-2">Message Preview</div>
        <div className="text-sm bg-brand-surface rounded-lg p-3 leading-relaxed text-brand-text">
          {campaign.messageBody}
        </div>
      </div>

      {/* Live delivery feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold flex items-center gap-2">
            Delivery Feed
            {(campaign.status === "sending") && (
              <div className="flex items-center gap-1 text-xs text-brand-orange">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                Live
              </div>
            )}
          </div>
          <div className="text-xs text-brand-muted">{totalMessages} messages</div>
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-brand-muted text-sm">No messages yet</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium truncate max-w-[200px]">{msg.customerName}</div>
                  <div className="text-xs text-brand-muted truncate max-w-[160px]">{msg.customerEmail}</div>
                </div>
                <StatusBadge status={msg.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
