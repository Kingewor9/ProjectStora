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
          gap: 8px;
          background: var(--tg-card-bg);
          border-radius: var(--stora-radius-md);
          padding: 12px 14px;
          box-shadow: var(--stora-shadow-card);
          color: var(--tg-hint-color);
        }
        .stora-search input {
          border: none;
          outline: none;
          background: transparent;
          flex: 1;
          font-size: 15px;
          color: var(--tg-text-color);
        }
        .stora-search input::placeholder {
          color: var(--tg-hint-color);
        }
      `}</style>
    </div>
  );
}
