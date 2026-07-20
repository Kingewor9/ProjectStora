import { useNavigate } from "react-router-dom";
import { ChevronRight, Send, Globe } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
];

const SUPPORT_HANDLE = "Storaofficialsupport";
const TELEGRAM_URL = "https://t.me/Stora_Official";
const WEB_URL = "https://stora.app";
const X_URL = "https://x.com/StoraApp";

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [language, setLanguage] = useState(user?.language ?? "en");

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photoUrl = user?.photo_url || (tgUser as any)?.photo_url;

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    // Persisted via a dedicated PATCH endpoint once added to the backend's
    // auth router (mirrors user_crud.update_language already in place).
  };

  const handleLogout = () => {
    window.Telegram?.WebApp?.close();
  };

  const openLink = (url: string) => {
    window.Telegram?.WebApp ? window.open(url, "_blank") : window.location.assign(url);
  };

  return (
    <div className="stora-page">
      <h1 className="stora-page-title">Settings</h1>

      <div className="stora-settings-profile">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="stora-settings-avatar" />
        ) : (
          <div className="stora-settings-avatar-placeholder">
            {(user?.first_name ?? "S").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <span className="stora-settings-name">
            {user?.username ? `@${user.username}` : user?.first_name}
          </span>
          <span className="stora-settings-id">{user?.telegram_id}</span>
          {user?.plan === "unlimited" ? (
            <span className="stora-settings-plan-badge">Unlimited</span>
          ) : null}
        </div>
      </div>

      <div className="stora-settings-section">
        <label className="stora-settings-row" htmlFor="language-select">
          <span>Language</span>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stora-settings-section">
        <button className="stora-settings-row stora-settings-link" onClick={() => navigate("/credits")}>
          <span>Stora Credits</span>
          <span className="stora-settings-value">
            {user?.credits ?? 0} credits
            <ChevronRight size={16} strokeWidth={2.2} />
          </span>
        </button>
        {user?.plan !== "unlimited" && (
          <button className="stora-settings-row stora-settings-link" onClick={() => navigate("/unlimited")}>
            <span>Go Unlimited</span>
            <span className="stora-settings-value">
              <ChevronRight size={16} strokeWidth={2.2} />
            </span>
          </button>
        )}
        <button
          className="stora-settings-row stora-settings-link"
          onClick={() => openLink(`https://t.me/${SUPPORT_HANDLE}`)}
        >
          <span>Support</span>
          <span className="stora-settings-value">
            <ChevronRight size={16} strokeWidth={2.2} />
          </span>
        </button>
      </div>

      <div className="stora-settings-section">
        <button className="stora-settings-row stora-settings-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="stora-settings-footer">
        <button onClick={() => openLink(TELEGRAM_URL)} aria-label="Telegram">
          <Send size={19} strokeWidth={1.9} />
        </button>
        <button onClick={() => openLink(WEB_URL)} aria-label="Website">
          <Globe size={19} strokeWidth={1.8} />
        </button>
        <button onClick={() => openLink(X_URL)} aria-label="X">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L7.4 4H5.5l12.2 16z" />
          </svg>
        </button>
      </div>

      <p className="stora-settings-version">Stora v1.0.0</p>

      <style>{`
        .stora-settings-profile {
          display: flex;
          align-items: center;
          gap: var(--stora-space-3);
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: 20px;
          box-shadow: var(--tg-glass-shadow);
          margin-bottom: var(--stora-space-4);
          position: relative;
          overflow: hidden;
        }
        .stora-settings-profile::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 100%;
          background: linear-gradient(135deg, rgba(77, 248, 255, 0.1), transparent 50%);
          pointer-events: none;
        }
        .stora-settings-avatar,
        .stora-settings-avatar-placeholder {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(77, 248, 255, 0.3), 0 4px 12px rgba(77, 248, 255, 0.1);
          position: relative;
          z-index: 1;
        }
        .stora-settings-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--tg-accent-color), color-mix(in srgb, var(--tg-accent-color) 60%, black));
          color: #fff;
          font-weight: 800;
          font-size: 24px;
        }
        .stora-settings-name {
          display: block;
          font-size: 18px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }
        .stora-settings-id {
          display: block;
          font-size: 13px;
          color: var(--tg-hint-color);
          position: relative;
          z-index: 1;
        }
        .stora-settings-plan-badge {
          display: inline-flex;
          margin-top: 8px;
          padding: 4px 10px;
          border-radius: var(--stora-radius-pill);
          background: color-mix(in srgb, var(--tg-button-color) 20%, transparent);
          border: 1px solid rgba(77, 248, 255, 0.2);
          color: var(--tg-button-color);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          position: relative;
          z-index: 1;
        }
        .stora-settings-section {
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          box-shadow: var(--tg-glass-shadow);
          margin-bottom: var(--stora-space-4);
          overflow: hidden;
        }
        .stora-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 500;
          color: var(--tg-text-color);
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .stora-settings-link:hover, .stora-settings-logout:hover {
          background-color: rgba(255,255,255,0.03);
        }
        .stora-settings-row + .stora-settings-row {
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .stora-settings-row select {
          background: none;
          border: none;
          color: var(--tg-accent-color);
          font-size: 15px;
          font-weight: 600;
          outline: none;
        }
        .stora-settings-value {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--tg-hint-color);
          font-size: 14px;
        }
        .stora-settings-logout {
          color: var(--tg-destructive-color);
          font-weight: 600;
        }
        .stora-settings-footer {
          display: flex;
          justify-content: center;
          gap: var(--stora-space-4);
          margin-top: var(--stora-space-6);
        }
        .stora-settings-footer button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--tg-card-bg);
          backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          color: var(--tg-hint-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .stora-settings-footer button:hover {
          border-color: var(--tg-accent-color);
          color: var(--tg-accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(77, 248, 255, 0.2);
        }
        .stora-settings-version {
          text-align: center;
          font-size: 12px;
          color: var(--tg-hint-color);
          opacity: 0.5;
          margin-top: var(--stora-space-4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}