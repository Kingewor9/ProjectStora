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
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-pill);
          padding: 8px;
          box-shadow: var(--tg-glass-shadow);
          z-index: 50;
        }
        .stora-nav-item {
          display: flex;
          text-decoration: none;
          color: var(--tg-hint-color);
          position: relative;
        }
        .stora-nav-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 24px;
          border-radius: var(--stora-radius-pill);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-nav-pill span {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          transition: transform 0.3s ease;
        }
        
        .stora-nav-item.active .stora-nav-pill {
          background: color-mix(in srgb, var(--tg-accent-color) 10%, transparent);
          color: var(--tg-accent-color);
          box-shadow: inset 0 0 0 1px rgba(77, 248, 255, 0.1);
        }
        
        /* Subtle glow dot for active element */
        .stora-nav-item.active::after {
          content: "";
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--tg-accent-color);
          box-shadow: 0 0 8px var(--tg-accent-color);
        }
        
        /* Interactive scaling */
        .stora-nav-item:active .stora-nav-pill {
          transform: scale(0.92);
        }
      `}</style>
    </nav>
  );
}