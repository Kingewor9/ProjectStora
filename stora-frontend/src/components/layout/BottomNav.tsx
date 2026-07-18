import { NavLink } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useUserStore } from "@/store/userStore";

const FoldersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.6 1z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export function BottomNav() {
  const isAdmin = useUserStore((s) => s.user?.is_admin ?? false);

  return (
    <nav className="stora-bottom-nav">
      <NavLink to="/folders" className={({ isActive }) => `stora-nav-item ${isActive ? "active" : ""}`}>
        <span className="stora-nav-pill">
          <FoldersIcon />
          <span>Folders</span>
        </span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/broadcast" className={({ isActive }) => `stora-nav-item ${isActive ? "active" : ""}`}>
          <span className="stora-nav-pill">
            <Megaphone size={20} strokeWidth={1.8} />
            <span>Broadcast</span>
          </span>
        </NavLink>
      )}
      <NavLink to="/settings" className={({ isActive }) => `stora-nav-item ${isActive ? "active" : ""}`}>
        <span className="stora-nav-pill">
          <SettingsIcon />
          <span>Settings</span>
        </span>
      </NavLink>
      <style>{`
        .stora-bottom-nav {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-pill);
          padding: 6px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          z-index: 50;
        }
        .stora-nav-item {
          display: flex;
          text-decoration: none;
          color: var(--tg-hint-color);
        }
        .stora-nav-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 7px 16px;
          border-radius: var(--stora-radius-pill);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .stora-nav-pill span {
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .stora-nav-item.active .stora-nav-pill {
          background: color-mix(in srgb, var(--tg-accent-color) 15%, transparent);
          color: var(--tg-accent-color);
        }
      `}</style>
    </nav>
  );
}