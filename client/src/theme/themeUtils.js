import {
  CLUB_CATEGORY_META,
  EVENT_CATEGORY_META,
  EVENT_STATUS_CLASS,
} from "./index";

// Club helpers
export function getClubMeta(key) {
  return CLUB_CATEGORY_META[key] || CLUB_CATEGORY_META.other;
}

export function clubBadgeClass(key) {
  return getClubMeta(key).badge;
}

export function clubEmoji(key) {
  return getClubMeta(key).emoji;
}

// Event helpers
export function getEventMeta(key) {
  return EVENT_CATEGORY_META[key] || EVENT_CATEGORY_META.meeting;
}

export function eventStatusClass(status) {
  return EVENT_STATUS_CLASS[status] || EVENT_STATUS_CLASS.upcoming;
}

export default {
  getClubMeta,
  clubBadgeClass,
  clubEmoji,
  getEventMeta,
  eventStatusClass,
};
