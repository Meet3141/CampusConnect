export const EVENT_CATEGORIES = [
  "hackathon",
  "workshop",
  "webinar",
  "cultural",
  "sports",
  "meeting",
];

export const EVENT_CATEGORY_META = {
  hackathon: { emoji: "💻", desc: "Code competitions" },
  workshop: { emoji: "🛠", desc: "Hands-on learning" },
  webinar: { emoji: "🎙", desc: "Online talks" },
  cultural: { emoji: "🎭", desc: "Culture & arts" },
  sports: { emoji: "⚡", desc: "Athletics events" },
  meeting: { emoji: "📋", desc: "General meetings" },
};

export const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];

export const EVENT_STATUS_CLASS = {
  upcoming: "bg-indigo-950 text-indigo-300 border-indigo-800",
  ongoing: "bg-emerald-950 text-emerald-300 border-emerald-800",
  completed: "bg-slate-800 text-slate-400 border-slate-700",
  cancelled: "bg-red-950 text-red-400 border-red-900",
};
