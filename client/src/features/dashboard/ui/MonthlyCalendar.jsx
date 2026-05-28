import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { cn } from "../../../utils/cn";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_DOT_COLORS = {
  hackathon: "var(--cc-color-brand)",
  workshop: "#3DA9A0",
  webinar: "var(--cc-color-accent)",
  cultural: "#7C6FCD",
  sports: "var(--cc-color-success)",
  meeting: "var(--cc-color-text-muted)",
  conference: "var(--cc-color-warning)",
  competition: "var(--cc-color-error)",
  default: "var(--cc-color-text-muted)",
};

const toDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatCategory = (value) =>
  (value || "other")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const formatDateLabel = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export default function MonthlyCalendar({
  events = [],
  loading = false,
  monthStart,
  doubleTapMs = 300,
  onEventClick,
}) {
  const reference = monthStart || new Date();
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const [activeKey, setActiveKey] = useState(null);
  const [isCardHover, setIsCardHover] = useState(false);
  const closeTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const containerRef = useRef(null);

  const monthLabel = useMemo(() => {
    const base = new Date(year, month, 1);
    return base.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      if (!ev?.timestamp) return;
      const d = new Date(ev.timestamp);
      if (Number.isNaN(d.getTime())) return;
      const key = toDayKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    });

    map.forEach((list) => {
      list.sort((a, b) => {
        if (b.registeredCount !== a.registeredCount) {
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        }
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
    });

    return map;
  }, [events]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, idx) => {
      const dayNumber = idx - startOffset + 1;
      const rowIndex = Math.floor(idx / 7);
      const colIndex = idx % 7;

      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { key: `empty-${idx}`, isPlaceholder: true, rowIndex, colIndex };
      }

      const date = new Date(year, month, dayNumber);
      return {
        key: toDayKey(date),
        date,
        dayNumber,
        isPlaceholder: false,
        rowIndex,
        colIndex,
      };
    });
  }, [year, month]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      if (!isCardHover) setActiveKey(null);
    }, 120);
  };

  const handleMouseEnter = (dayKey, hasEvents) => {
    if (!hasEvents) return;
    clearCloseTimer();
    setActiveKey(dayKey);
  };

  const handleMouseLeave = () => {
    scheduleClose();
  };

  const handlePointerUp = (event, dayKey, hasEvents) => {
    if (event.pointerType !== "touch") return;
    if (!hasEvents) {
      setActiveKey(null);
      return;
    }

    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < doubleTapMs) {
      setActiveKey(dayKey);
      return;
    }

    setActiveKey((prev) => (prev === dayKey ? null : dayKey));
  };

  const handleFocus = (dayKey, hasEvents) => {
    if (hasEvents) setActiveKey(dayKey);
  };

  const handleBlur = () => {
    scheduleClose();
  };

  useEffect(() => {
    if (!activeKey) return undefined;
    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setActiveKey(null);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [activeKey]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-cc-soft bg-cc-surface/80 backdrop-blur-xl shadow-overlay p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 w-32 cc-skeleton rounded-md" />
          <div className="h-4 w-12 cc-skeleton rounded-md" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="h-9 rounded-xl cc-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-cc-soft bg-cc-surface/80 backdrop-blur-xl shadow-overlay p-3 overflow-visible"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-body-sm font-semibold text-cc">{monthLabel}</p>
        </div>
        {events.length > 0 && (
          <span className="text-[10px] font-mono tabular-nums px-1.5 py-px bg-cc-surface-weak text-muted rounded-md">
            {events.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEK_DAYS.map((label) => (
          <span
            key={label}
            className="text-[9px] uppercase tracking-widest text-muted font-mono"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 overflow-visible">
        {cells.map((cell) => {
          if (cell.isPlaceholder) {
            return <div key={cell.key} className="h-10" aria-hidden="true" />;
          }

          const dayKey = cell.key;
          const dayEvents = eventsByDay.get(dayKey) || [];
          const hasEvents = dayEvents.length > 0;
          const isActive = activeKey === dayKey;
          const dots = dayEvents.slice(0, 4);
          const overflow = Math.max(0, dayEvents.length - dots.length);

          const alignClass =
            cell.colIndex >= 5
              ? "right-0"
              : cell.colIndex <= 1
              ? "left-0"
              : "left-1/2 -translate-x-1/2";
          const verticalClass = cell.rowIndex >= 4 ? "bottom-full mb-2" : "top-full mt-2";

          return (
            <div
              key={cell.key}
              className="relative h-10 flex flex-col items-center justify-start"
              onMouseEnter={() => handleMouseEnter(dayKey, hasEvents)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={cn(
                  "w-full h-full flex flex-col items-center justify-start gap-0.5 rounded-xl border border-transparent transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  isActive && hasEvents && "bg-cc-surface-hover border-hover"
                )}
                style={{ touchAction: "manipulation" }}
                aria-label={`${formatDateLabel(cell.date)}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ", no events"}`}
                onPointerUp={(event) => handlePointerUp(event, dayKey, hasEvents)}
                onFocus={() => handleFocus(dayKey, hasEvents)}
                onBlur={handleBlur}
              >
                <span className="w-6 h-6 rounded-lg border border-cc-soft flex items-center justify-center text-[11px] font-semibold text-cc">
                  {cell.dayNumber}
                </span>
                <div className="flex items-center justify-center gap-1 min-h-[6px]">
                  {dots.map((ev) => (
                    <span
                      key={ev.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_DOT_COLORS[ev.category] || CATEGORY_DOT_COLORS.default,
                      }}
                    />
                  ))}
                  {overflow > 0 && (
                    <span className="text-[8px] font-semibold text-muted">+{overflow}</span>
                  )}
                </div>
              </button>

              {isActive && hasEvents && (
                <div
                  className={cn(
                    "absolute z-dropdown w-[280px]",
                    alignClass,
                    verticalClass
                  )}
                  onMouseEnter={() => {
                    clearCloseTimer();
                    setIsCardHover(true);
                  }}
                  onMouseLeave={() => {
                    setIsCardHover(false);
                    setActiveKey(null);
                  }}
                >
                  <Card
                    variant="elevated"
                    padding="sm"
                    className="border border-cc-soft bg-cc-surface shadow-overlay"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-body-sm font-semibold text-cc">
                          {formatDateLabel(cell.date)}
                        </p>
                        <p className="text-micro text-muted">{dayEvents.length} events</p>
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            onEventClick?.(ev);
                            setActiveKey(null);
                          }}
                          className={cn(
                            "w-full text-left flex items-start justify-between gap-3",
                            "border border-cc-soft rounded-xl p-2",
                            "bg-cc-surface-weak hover:bg-cc-surface-hover",
                            "transition-colors"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold text-cc truncate">{ev.title}</p>
                            <p className="text-caption text-muted truncate">{ev.organizerLabel}</p>
                          </div>
                          <Badge size="xs" variant={ev.category || "default"} className="shrink-0">
                            {formatCategory(ev.category)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="text-caption text-muted mt-2">
          No events scheduled for this month yet.
        </p>
      )}
    </div>
  );
}
