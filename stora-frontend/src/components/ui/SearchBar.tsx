import type { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div className="stora-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <style>{`
        .stora-search {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(var(--tg-glass-blur));
          -webkit-backdrop-filter: blur(var(--tg-glass-blur));
          border: 1px solid var(--tg-glass-border);
          border-radius: var(--stora-radius-xl);
          padding: 14px 18px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          color: var(--tg-hint-color);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stora-search:focus-within {
          border-color: var(--tg-accent-color);
          box-shadow: 0 0 16px rgba(77, 248, 255, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1);
          color: var(--tg-accent-color);
        }
        .stora-search input {
          border: none;
          outline: none;
          background: transparent;
          flex: 1;
          font-size: 16px;
          font-weight: 500;
          color: var(--tg-text-color);
        }
        .stora-search input::placeholder {
          color: var(--tg-hint-color);
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
