import { useEffect, useState } from "react";
import { Plus, Filter, Trash2, Users, ChevronRight } from "lucide-react";
import { getSegments, createSegment, deleteSegment, previewSegment } from "../lib/api";
import PageHeader from "../components/ui/PageHeader";

const FIELD_OPTIONS = [
  { value: "totalSpend", label: "Total Spend (₹)" },
  { value: "orderCount", label: "Order Count" },
  { value: "daysSinceLastOrder", label: "Days Since Last Order" },
  { value: "daysSinceJoined", label: "Days Since Joined" },
  { value: "city", label: "City" },
  { value: "favouriteItem", label: "Favourite Item" },
];

const OPERATOR_OPTIONS = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
  { value: "contains", label: "contains" },
];

function RuleRow({ rule, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="input text-sm flex-1"
        value={rule.field}
        onChange={(e) => onChange({ ...rule, field: e.target.value })}
      >
        {FIELD_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        className="input text-sm w-20"
        value={rule.operator}
        onChange={(e) => onChange({ ...rule, operator: e.target.value })}
      >
        {OPERATOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        className="input text-sm w-24"
        value={rule.value}
        onChange={(e) => onChange({ ...rule, value: e.target.value })}
        placeholder="value"
      />
      <button onClick={onRemove} className="text-brand-muted hover:text-red-400 transition-colors p-1">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rules: [{ field: "daysSinceLastOrder", operator: "gt", value: "30" }] });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = () => {
    setLoading(true);
    getSegments()
      .then((d) => setSegments(d.segments || []))
      .finally(() => setLoading(false));
  };

  const handlePreview = async () => {
    try {
      const rules = form.rules.map((r) => ({
        ...r,
        value: isNaN(r.value) ? r.value : Number(r.value),
      }));
      const res = await previewSegment(rules);
      setPreview(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async () => {
    if (!form.name) return alert("Segment name is required");
    setSaving(true);
    try {
      const rules = form.rules.map((r) => ({
        ...r,
        value: isNaN(r.value) ? r.value : Number(r.value),
      }));
      await createSegment({ ...form, rules });
      setShowCreate(false);
      setForm({ name: "", description: "", rules: [{ field: "daysSinceLastOrder", operator: "gt", value: "30" }] });
      setPreview(null);
      loadSegments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this segment?")) return;
    await deleteSegment(id);
    loadSegments();
  };

  const addRule = () =>
    setForm((f) => ({ ...f, rules: [...f.rules, { field: "orderCount", operator: "gte", value: "5" }] }));

  return (
    <div className="p-6">
      <PageHeader
        title="Segments"
        subtitle="Define audiences to target with campaigns"
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Segment
          </button>
        }
      />

      {/* Create Form */}
      {showCreate && (
        <div className="card mb-6 border-brand-orange/30 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Filter size={14} className="text-brand-orange" />
              Create Segment
            </div>
            <button onClick={() => setShowCreate(false)} className="text-brand-muted hover:text-brand-text text-sm">✕</button>
          </div>

          <div className="space-y-3 mb-4">
            <input
              className="input text-sm"
              placeholder="Segment name (e.g. Win-Back Customers)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input text-sm"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="text-xs font-medium text-brand-muted uppercase tracking-wide mb-2">Rules (ALL must match)</div>
          <div className="space-y-2 mb-3">
            {form.rules.map((rule, i) => (
              <RuleRow
                key={i}
                rule={rule}
                onChange={(r) => setForm((f) => ({ ...f, rules: f.rules.map((x, j) => j === i ? r : x) }))}
                onRemove={() => setForm((f) => ({ ...f, rules: f.rules.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>
          <button onClick={addRule} className="text-xs text-brand-orange hover:underline mb-4">+ Add rule</button>

          {preview && (
            <div className="bg-brand-surface rounded-lg p-3 mb-3 text-sm">
              <span className="text-brand-orange font-semibold">{preview.count}</span>
              <span className="text-brand-muted"> customers match these rules</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handlePreview} className="btn-secondary text-sm flex-1">Preview</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1">
              {saving ? "Saving..." : "Save Segment"}
            </button>
          </div>
        </div>
      )}

      {/* Segments list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <div className="card text-center py-12 text-brand-muted">
          No segments yet. Create one or use the AI Campaign Builder.
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg.id} className="card hover:border-brand-border/80 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-orange/10 rounded-lg">
                    <Filter size={14} className="text-brand-orange" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{seg.name}</div>
                    <div className="text-xs text-brand-muted">{seg.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-brand-muted">
                    <Users size={12} />
                    {seg.customerCount ?? "—"}
                  </div>
                  <button
                    onClick={() => handleDelete(seg.id)}
                    className="opacity-0 group-hover:opacity-100 text-brand-muted hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {seg.rules?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {seg.rules.map((r, i) => (
                    <span key={i} className="text-[10px] font-mono bg-brand-surface px-2 py-1 rounded text-brand-muted border border-brand-border">
                      {r.field} {r.operator} {r.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
