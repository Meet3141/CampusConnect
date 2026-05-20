import {
  IconAdmin,
  IconBookmark,
  IconChat,
  IconClubs,
  IconDashboard,
  IconEvents,
  IconGlobe,
  IconStats,
  IconVerify,
  IconVolunteer,
} from "./LayoutIcons";

export const NAV = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: IconDashboard },
      { label: "My Clubs", path: "/my-clubs", icon: IconClubs },
      { label: "Discover Clubs", path: "/clubs", icon: IconClubs },
      { label: "Events", path: "/events", icon: IconEvents },
      { label: "Chats", path: "/chats", icon: IconChat },
    ],
  },
  {
    section: "Discover",
    items: [
      { label: "Volunteer Hub", path: "/volunteers", icon: IconVolunteer },
      { label: "External Events", path: "/external-events", icon: IconGlobe },
      { label: "Bookmarks", path: "/bookmarks", icon: IconBookmark },
    ],
  },
];

export function getAdminNav({ isAdmin, isEditor, isClubAdmin }) {
  return [
    ...(isAdmin ? [{ label: "Admin Panel", path: "/admin", icon: IconAdmin }] : []),
    ...((isEditor || isAdmin)
      ? [{ label: "Verify Events", path: "/admin/verify", icon: IconVerify }]
      : []),
    ...(isAdmin ? [{ label: "Analytics", path: "/admin/stats", icon: IconStats }] : []),
    ...((isAdmin || isClubAdmin)
      ? [{ label: "Reviews", path: "/admin/reviews", icon: IconVerify }]
      : []),
  ];
}
