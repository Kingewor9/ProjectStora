import { useNavigate } from "react-router-dom";
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
          <span className="stora-settings-value">{user?.credits ?? 0} credits ›</span>
        </button>
        <button
          className="stora-settings-row stora-settings-link"
          onClick={() => openLink(`https://t.me/${SUPPORT_HANDLE}`)}
        >
          <span>Support</span>
          <span className="stora-settings-value">›</span>
        </button>
      </div>

      <div className="stora-settings-section">
        <button className="stora-settings-row stora-settings-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="stora-settings-footer">
        <button onClick={() => openLink(TELEGRAM_URL)} aria-label="Telegram">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.8 3.6L2.7 11c-1 .4-1 1.7.1 2l4.7 1.5 1.8 5.7c.2.7 1.1.9 1.6.3l2.6-2.9 4.9 3.6c.8.6 1.9.1 2.1-.9l3.1-14.7c.2-1-.8-1.8-1.8-1z" />
          </svg>
        </button>
        <button onClick={() => openLink(WEB_URL)} aria-label="Website">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
          </svg>
        </button>
        <button onClick={() => openLink(X_URL)} aria-label="X">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L7.4 4H5.5l12.2 16z" />
          </svg>
        </button>
      </div>

      <style>{`
        .stora-settings-profile {
          display: flex;
          align-items: center;
          gap: var(--stora-space-3);
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          padding: var(--stora-space-4);
          box-shadow: var(--stora-shadow-card);
          margin-bottom: var(--stora-space-4);
        }
        .stora-settings-avatar,
        .stora-settings-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .stora-settings-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--tg-accent-color);
          color: #fff;
          font-weight: 700;
          font-size: 18px;
        }
        .stora-settings-name {
          display: block;
          font-size: 16px;
          font-weight: 700;
        }
        .stora-settings-id {
          display: block;
          font-size: 13px;
          color: var(--tg-hint-color);
        }
        .stora-settings-plan-badge {
          display: inline-flex;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: var(--stora-radius-pill);
          background: color-mix(in srgb, var(--tg-button-color) 16%, transparent);
          color: var(--tg-button-color);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stora-settings-section {
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-lg);
          box-shadow: var(--stora-shadow-card);
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
          padding: 16px;
          font-size: 15px;
          color: var(--tg-text-color);
          text-align: left;
          cursor: pointer;
        }
        .stora-settings-row + .stora-settings-row {
          border-top: 1px solid var(--tg-secondary-bg-color);
        }
        .stora-settings-row select {
          background: none;
          border: none;
          color: var(--tg-hint-color);
          font-size: 15px;
        }
        .stora-settings-value {
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
          gap: var(--stora-space-3);
          margin-top: var(--stora-space-5);
        }
        .stora-settings-footer button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--tg-card-bg);
          border: none;
          color: var(--tg-hint-color);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
