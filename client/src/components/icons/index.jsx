/**
 * src/components/icons/index.jsx
 * ─────────────────────────────────────────────────────────────────
 * Central icon registry for CampusConnect.
 * All Lucide imports are tree-shaken by Vite — only imported icons ship.
 *
 * Usage:
 *   import { CalendarIcon, MapPinIcon, CategoryIcon } from "@/components/icons";
 *   <CalendarIcon size={24} className="text-cc-muted" />
 *
 * Category icons are exposed via CATEGORY_ICON map for use in theme files.
 * ─────────────────────────────────────────────────────────────────
 */

export {
  // ── Calendar / Event ──
  Calendar        as CalendarIcon,
  CalendarX2      as CalendarEmptyIcon,
  CalendarCheck   as CalendarCheckIcon,
  CalendarClock   as CalendarClockIcon,

  // ── Location ──
  MapPin          as MapPinIcon,

  // ── Time ──
  Clock           as ClockIcon,
  Hourglass       as HourglassIcon,
  Timer           as TimerIcon,

  // ── People ──
  Users           as UsersIcon,
  UserCheck       as UserCheckIcon,
  UserX           as UserXIcon,
  UserPlus        as UserPlusIcon,
  User            as UserIcon,
  HandHeart       as VolunteerIcon,

  // ── Clubs / Buildings ──
  Building2       as BuildingIcon,
  Library         as LibraryIcon,
  University      as UniversityIcon,

  // ── Communication ──
  MessageCircle   as ChatIcon,
  MessageSquareOff as ChatEmptyIcon,
  Mic             as MicIcon,
  Bell            as BellIcon,

  // ── Actions ──
  Bookmark        as BookmarkIcon,
  BookmarkCheck   as BookmarkFilledIcon,
  BookmarkX       as BookmarkEmptyIcon,
  Settings        as SettingsIcon,
  Trash2          as TrashIcon,
  Globe           as GlobeIcon,
  Lock            as LockIcon,
  Search          as SearchIcon,
  ChevronRight    as ChevronRightIcon,
  ArrowRight      as ArrowRightIcon,
  ExternalLink    as ExternalLinkIcon,
  Check           as CheckIcon,
  CheckCircle2    as CheckCircleIcon,
  XCircle         as XCircleIcon,
  AlertCircle     as AlertCircleIcon,
  Info            as InfoIcon,
  BarChart3       as BarChartIcon,
  TrendingUp      as TrendingUpIcon,
  Pencil          as EditIcon,

  // ── Category: Events ──
  Code2           as HackathonIcon,
  Wrench          as WorkshopIcon,
  Drama           as CulturalIcon,
  Zap             as SportsIcon,
  ClipboardList   as MeetingIcon,
  Trophy          as CompetitionIcon,
  Landmark        as ConferenceIcon,

  // ── Category: Clubs ──
  Cpu             as TechnicalIcon,
  BookOpen        as AcademicIcon,
  Palette         as ArtsIcon,

  // ── Misc ──
  Star            as StarIcon,
  Flame           as FlameIcon,
  Sparkles        as SparklesIcon,
  LogOut          as LogOutIcon,
  Menu            as MenuIcon,
  Sun             as SunIcon,
  Moon            as MoonIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Semantic category → icon component map
// Use these in theme files instead of emoji strings.
// ─────────────────────────────────────────────────────────────────
export { Code2       as EventIconHackathon  } from "lucide-react";
export { Wrench      as EventIconWorkshop   } from "lucide-react";
export { Mic         as EventIconWebinar    } from "lucide-react";
export { Drama       as EventIconCultural   } from "lucide-react";
export { Zap         as EventIconSports     } from "lucide-react";
export { ClipboardList as EventIconMeeting  } from "lucide-react";
export { Trophy      as EventIconCompetition} from "lucide-react";
export { Landmark    as EventIconConference } from "lucide-react";

export { Cpu         as ClubIconTechnical   } from "lucide-react";
export { Drama       as ClubIconCultural    } from "lucide-react";
export { Zap         as ClubIconSports      } from "lucide-react";
export { BookOpen    as ClubIconAcademic    } from "lucide-react";
export { Palette     as ClubIconArts        } from "lucide-react";
export { Globe       as ClubIconOther       } from "lucide-react";
