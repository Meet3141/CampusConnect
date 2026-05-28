import { Code2, Wrench, Mic, Drama, Zap, ClipboardList, Trophy, Landmark } from "lucide-react";

export const EVENT_CATEGORIES = [
  "hackathon",
  "workshop",
  "webinar",
  "cultural",
  "sports",
  "meeting",
];

export const EVENT_CATEGORY_META = {
  hackathon:   { Icon: Code2,        desc: "Code competitions" },
  workshop:    { Icon: Wrench,       desc: "Hands-on learning" },
  webinar:     { Icon: Mic,          desc: "Online talks" },
  cultural:    { Icon: Drama,        desc: "Culture & arts" },
  sports:      { Icon: Zap,          desc: "Athletics events" },
  meeting:     { Icon: ClipboardList,desc: "General meetings" },
  competition: { Icon: Trophy,       desc: "Competitions" },
  conference:  { Icon: Landmark,     desc: "Conferences" },
};

export const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];

export const EVENT_STATUS_CLASS = {
  upcoming: "bg-indigo-950 text-indigo-300 border-indigo-800",
  ongoing: "bg-emerald-950 text-emerald-300 border-emerald-800",
  completed: "bg-slate-800 text-slate-400 border-slate-700",
  cancelled: "bg-red-950 text-red-400 border-red-900",
};
