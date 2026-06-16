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
  upcoming: "cc-status-upcoming",
  ongoing: "cc-status-ongoing",
  completed: "cc-status-completed",
  cancelled: "cc-status-cancelled",
};
