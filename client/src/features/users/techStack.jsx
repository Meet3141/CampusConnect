import { useState } from "react";
import { Code2, X } from "lucide-react";
import { getIconifySvgUrl, normalizeTechStack } from "./techStackUtils";

function TechIcon({ icon, label, iconWrapStyle }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : getIconifySvgUrl(icon);

  return (
    <span style={iconWrapStyle} aria-hidden="true">
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: 16, height: 16, display: "block", objectFit: "contain" }}
        />
      ) : (
        <Code2 size={15} strokeWidth={2} aria-label={`${label} icon`} />
      )}
    </span>
  );
}

export function TechStackBadges({
  items,
  emptyText = "No technologies added.",
  removable = false,
  onRemove,
  chipStyle,
  iconWrapStyle,
  labelStyle,
  removeStyle,
  emptyStyle,
}) {
  const stack = normalizeTechStack(items);

  if (!stack.length) {
    return <p style={emptyStyle}>{emptyText}</p>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {stack.map((item) => (
        <span key={item.label.toLowerCase()} style={chipStyle}>
          <TechIcon icon={item.icon} label={item.label} iconWrapStyle={iconWrapStyle} />
          <span style={labelStyle}>{item.label}</span>
          {removable && (
            <button
              type="button"
              onClick={() => onRemove?.(item.label)}
              style={removeStyle}
              aria-label={`Remove ${item.label}`}
            >
              <X size={13} strokeWidth={2.4} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
