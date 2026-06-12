import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Filter, Megaphone,
  BarChart3, MessageSquareText, Zap, LogOut, ChevronDown
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquareText, label: "AI Campaign Builder", highlight: true },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/segments", icon: Filter, label: "Segments" },
  { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "BL";

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-brand-surface border-r border-brand-border">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center shadow-md shadow-brand-orange/30">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <div className="font-bold text-brand-text text-sm leading-tight">BiteLoop</div>
              <div className="text-[10px] text-brand-muted leading-tight">CRM Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-brand-orange/15 text-brand-orange font-medium"
                    : highlight
                    ? "text-brand-orange/80 hover:bg-brand-orange/10 hover:text-brand-orange"
                    : "text-brand-muted hover:bg-brand-card hover:text-brand-text"
                )
              }
            >
              <Icon size={16} />
              <span>{label}</span>
              {highlight && (
                <span className="ml-auto text-[9px] bg-brand-orange text-white px-1.5 py-0.5 rounded-full font-bold">
                  AI
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-brand-border">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-brand-card transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-xs font-bold text-brand-orange flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium text-brand-text truncate">
                  {user?.email?.split("@")[0] || "User"}
                </div>
                <div className="text-[10px] text-brand-muted truncate">
                  {user?.email}
                </div>
              </div>
              <ChevronDown size={12} className={clsx("text-brand-muted transition-transform", showUserMenu && "rotate-180")} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-brand-card border border-brand-border rounded-lg overflow-hidden shadow-xl animate-slide-up">
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
