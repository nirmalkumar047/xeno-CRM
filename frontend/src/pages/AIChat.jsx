import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Loader2, Zap, CheckCircle, Users, Megaphone } from "lucide-react";
import { aiChat, createSegment, createCampaign, previewSegment } from "../lib/api";
import clsx from "clsx";

const STARTERS = [
  "Reach customers who haven't ordered in 30 days with a win-back offer",
  "Target high-value customers (spent over ₹3000) with an exclusive loyalty reward",
  "Send a weekend special to customers in Mumbai who love burgers",
  "Re-engage customers who ordered less than 3 times with a discount",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex gap-3 animate-slide-up", isUser && "flex-row-reverse")}>
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5",
          isUser ? "bg-brand-orange text-white" : "bg-brand-surface border border-brand-border text-brand-orange"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={clsx("max-w-[80%] space-y-2", isUser && "items-end flex flex-col")}>
        <div
          className={clsx(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-brand-orange text-white rounded-tr-sm"
              : "bg-brand-card border border-brand-border text-brand-text rounded-tl-sm"
          )}
        >
          {msg.content}
        </div>

        {/* Action cards */}
        {msg.action && <ActionCard action={msg.action} />}
      </div>
    </div>
  );
}

function ActionCard({ action }) {
  const navigate = useNavigate();
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setState("loading");
    try {
      if (action.type === "create_segment") {
        const seg = await createSegment(action.data);
        setResult(seg);
        setState("done");
      } else if (action.type === "create_campaign") {
        const camp = await createCampaign(action.data);
        setResult(camp);
        setState("done");
      }
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  };

  if (action.type === "create_segment") {
    return (
      <div className="card border-brand-orange/30 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-brand-orange" />
          <span className="text-xs font-semibold text-brand-orange">Segment Ready</span>
        </div>
        <div className="font-medium text-sm mb-1">{action.data.segmentName}</div>
        <div className="text-xs text-brand-muted mb-3">{action.data.description}</div>
        <div className="space-y-1 mb-3">
          {action.data.rules?.map((r, i) => (
            <div key={i} className="text-xs font-mono bg-brand-surface px-2 py-1 rounded text-brand-muted">
              {r.field} {r.operator} {r.value}
            </div>
          ))}
        </div>
        {state === "idle" && (
          <button onClick={handleCreate} className="btn-primary text-xs w-full">
            Save Segment
          </button>
        )}
        {state === "loading" && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Loader2 size={12} className="animate-spin" /> Saving...
          </div>
        )}
        {state === "done" && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle size={12} /> Segment saved!
          </div>
        )}
        {state === "error" && <div className="text-xs text-red-400">{error}</div>}
      </div>
    );
  }

  if (action.type === "create_campaign") {
    return (
      <div className="card border-brand-orange/30 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone size={14} className="text-brand-orange" />
          <span className="text-xs font-semibold text-brand-orange">Campaign Draft</span>
        </div>
        <div className="font-medium text-sm mb-1">{action.data.name}</div>
        <div className="text-xs text-brand-muted mb-1 font-medium">Subject:</div>
        <div className="text-xs mb-2 text-brand-text">{action.data.subject}</div>
        <div className="text-xs text-brand-muted mb-1 font-medium">Message:</div>
        <div className="text-xs mb-3 bg-brand-surface p-2 rounded leading-relaxed">{action.data.messageBody}</div>
        {state === "idle" && (
          <button onClick={handleCreate} className="btn-primary text-xs w-full">
            Save Campaign Draft
          </button>
        )}
        {state === "loading" && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Loader2 size={12} className="animate-spin" /> Saving...
          </div>
        )}
        {state === "done" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle size={12} /> Campaign saved as draft!
            </div>
            <button
              onClick={() => navigate(`/campaigns/${result.id}`)}
              className="btn-secondary text-xs w-full"
            >
              View Campaign →
            </button>
          </div>
        )}
        {state === "error" && <div className="text-xs text-red-400">{error}</div>}
      </div>
    );
  }

  return null;
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I'm your BiteLoop campaign assistant. Tell me who you want to reach and what you want to say — I'll build the segment and draft the message for you. Try something like \"reach customers who haven't ordered in 30 days\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setInput("");
    const userMsg = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      // Only send last 10 messages to keep context manageable
      const history = updated.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiChat(history);
      const assistantMsg = { role: "assistant", content: res.reply, action: res.action };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-brand-border bg-brand-surface flex items-center gap-3">
        <div className="p-2 bg-brand-orange/15 rounded-lg">
          <Zap size={18} className="text-brand-orange" />
        </div>
        <div>
          <div className="font-bold text-sm">AI Campaign Builder</div>
          <div className="text-xs text-brand-muted">Powered by Groq · llama-3.3-70b</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-brand-muted">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center">
              <Bot size={14} className="text-brand-orange" />
            </div>
            <div className="bg-brand-card border border-brand-border px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="px-6 pb-3">
          <div className="text-xs text-brand-muted mb-2">Try asking:</div>
          <div className="grid grid-cols-2 gap-2">
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-left text-xs p-2.5 rounded-lg border border-brand-border
                           hover:border-brand-orange/50 hover:bg-brand-orange/5 transition-all text-brand-muted
                           hover:text-brand-text"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2 border-t border-brand-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Describe who you want to reach..."
            rows={1}
            className="input resize-none py-2.5 text-sm"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="text-[10px] text-brand-muted mt-1.5 pl-1">
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
