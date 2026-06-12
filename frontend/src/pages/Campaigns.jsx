import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Megaphone, Send, Eye, MousePointerClick, Loader2 } from "lucide-react";
import { getCampaigns, getSegments, createCampaign, sendCampaign, draftMessage } from "../lib/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", segmentId: "", subject: "", messageBody: "", channel: "email" });
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCampaigns(), getSegments()])
      .then(([c, s]) => {
        setCampaigns(c.campaigns || []);
        setSegments(s.segments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDraft = async () => {
    if (!form.segmentId) return alert("Select a segment first");
    const seg = segments.find((s) => s.id === form.segmentId);
    setDraftLoading(true);
    try {
      const res = await draftMessage(seg?.description || seg?.name || "general audience");
      setForm((f) => ({ ...f, subject: res.subject, messageBody: res.body }));
    } catch (err) {
      alert(err.message);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.segmentId || !form.messageBody) return alert("Name, segment and message are required");
    setSaving(true);
    try {
      await createCampaign(form);
      setShowCreate(false);
      setForm({ name: "", segmentId: "", subject: "", messageBody: "", channel: "email" });
      const c = await getCampaigns();
      setCampaigns(c.campaigns || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id) => {
    if (!confirm("Send this campaign now?")) return;
    setSendingId(id);
    try {
      await sendCampaign(id);
      const c = await getCampaigns();
      setCampaigns(c.campaigns || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Campaigns"
        subtitle="Create and track your marketing campaigns"
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Campaign
          </button>
        }
      />

      {showCreate && (
        <div className="card mb-6 border-brand-orange/30 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Megaphone size={14} className="text-brand-orange" /> Create Campaign
            </div>
            <button onClick={() => setShowCreate(false)} className="text-brand-muted hover:text-brand-text">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              className="input text-sm col-span-2"
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className="input text-sm"
              value={form.segmentId}
              onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
            >
              <option value="">Select segment...</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.customerCount} customers)</option>
              ))}
            </select>
            <select
              className="input text-sm"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <input
            className="input text-sm mb-3"
            placeholder="Subject line"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
          <textarea
            className="input text-sm mb-1 resize-none"
            rows={4}
            placeholder="Message body. Use {firstName} and {favouriteItem} as placeholders."
            value={form.messageBody}
            onChange={(e) => setForm((f) => ({ ...f, messageBody: e.target.value }))}
          />
          <div className="text-[10px] text-brand-muted mb-3">
            Placeholders: {"{firstName}"}, {"{favouriteItem}"}
          </div>

          <div className="flex gap-2">
            <button onClick={handleDraft} disabled={draftLoading} className="btn-secondary text-sm flex items-center gap-2">
              {draftLoading ? <Loader2 size={12} className="animate-spin" /> : null}
              AI Draft Message
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1">
              {saving ? "Saving..." : "Save as Draft"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-12 text-brand-muted text-sm">
          No campaigns yet.{" "}
          <Link to="/chat" className="text-brand-orange hover:underline">Use AI to build your first one →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card hover:border-brand-border/80 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Link to={`/campaigns/${c.id}`} className="font-semibold text-sm hover:text-brand-orange transition-colors">
                    {c.name}
                  </Link>
                  <div className="text-xs text-brand-muted mt-0.5">{c.subject}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  {c.status === "draft" && (
                    <button
                      onClick={() => handleSend(c.id)}
                      disabled={sendingId === c.id}
                      className="btn-primary text-xs flex items-center gap-1 py-1"
                    >
                      {sendingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Send
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-brand-muted">
                <span className="flex items-center gap-1">
                  <Send size={11} /> {c.stats?.sent || 0} sent
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Send size={11} /> {c.stats?.delivered || 0} delivered
                </span>
                <span className="flex items-center gap-1 text-brand-orange">
                  <Eye size={11} /> {c.stats?.opened || 0} opened
                </span>
                <span className="flex items-center gap-1 text-brand-yellow">
                  <MousePointerClick size={11} /> {c.stats?.clicked || 0} clicked
                </span>
                {c.stats?.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    ✕ {c.stats.failed} failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
