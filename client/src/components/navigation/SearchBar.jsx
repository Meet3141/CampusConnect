/**
 * SearchBar.jsx — Phase 5: Rich predictive search with focus expansion
 * Features:
 *   - Focus expansion (glow + border + subtle shadow)
 *   - Animated search icon → seamless icon
 *   - Keyboard shortcut hint (⌘K / Ctrl+K) in unfocused state
 *   - Semantic token classes (light-theme compatible)
 *   - Clear button with fade-in
 *
 * Usage:
 *   <SearchBar value={search} onChange={setSearch} placeholder="Search events…" />
 *   <SearchBar value={search} onChange={setSearch} shortcutHint />
 */
import { useRef, useState } from "react";
import { cn } from "../../utils/cn";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  onFocus,
  onBlur,
  shortcutHint = false,
}) {
  const ref = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  /* ⌘K / Ctrl+K to focus */
  const isTyping = value.length > 0;

  return (
    <div className={cn("relative flex-1 transition-all duration-200", className)}>
      {/* Search icon */}
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
        style={{ color: isFocused ? "var(--cc-color-accent)" : "var(--cc-color-text-muted)" }}
        aria-hidden="true"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transition: "stroke 200ms ease, transform 200ms ease",
            transform: isFocused ? "scale(1.1)" : "scale(1)",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={placeholder}
        className="w-full rounded-xl pl-9 pr-9 py-2.5 text-sm text-cc placeholder:text-muted transition-all duration-200 focus:outline-none"
        style={{
          background: isFocused
            ? "var(--cc-color-surface)"
            : "var(--cc-color-surface-weak)",
          border: `1px solid ${isFocused ? "var(--cc-color-accent)" : "var(--cc-color-border-subtle)"}`,
          boxShadow: isFocused
            ? "0 0 0 3px rgba(0,188,235,0.12), 0 2px 8px rgba(0,0,0,0.08)"
            : "none",
        }}
      />

      {/* Right area: clear button OR shortcut hint */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {/* Shortcut hint — only when empty + not focused */}
        {shortcutHint && !isTyping && !isFocused && (
          <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted font-mono opacity-60 select-none">
            <kbd className="px-1 py-px bg-cc-surface-weak border border-cc-soft rounded text-[9px]">
              {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="px-1 py-px bg-cc-surface-weak border border-cc-soft rounded text-[9px]">K</kbd>
          </span>
        )}

        {/* Clear button */}
        {isTyping && (
          <button
            type="button"
            onClick={() => { onChange(""); ref.current?.focus(); }}
            aria-label="Clear search"
            className="text-muted hover:text-cc transition-colors duration-150 hover:scale-110 active:scale-90"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
