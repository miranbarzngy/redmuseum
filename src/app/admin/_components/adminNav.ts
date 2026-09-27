import {
  LayoutDashboard,
  CalendarClock,
  CalendarPlus,
  CalendarCog,
  Images,
  ImagePlus,
  UserRound,
  BookOpen,
  BookPlus,
  Inbox,
  MessageCircle,
  Ticket,
  Settings,
  Users,
  ClipboardList,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

// One place for every admin destination, shared by AdminShell (sidebar,
// bottom bar, «زیاتر» sheet), the command palette and the overview's
// shortcut tiles, so a new section only has to be added once.
//
// `shortLabel` is the compact form for the phone bottom bar, where a
// two-word label like «بەشەکانی مۆزەخانە» wraps to two lines and breaks the
// row's alignment. The sidebar and «زیاتر» sheet always use the full `label`.
// `permission`, when set, hides the item from any session whose role
// doesn't hold it (see src/lib/permissions.ts). Every section item sets
// one, matching its actions.ts's own requireAdminSession(permission) check
// — گشتی (the dashboard home) is the one deliberate exception, visible to
// any logged-in admin regardless of role.
export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  permission?: string;
  /** Extra words the command palette matches on besides `label`. */
  keywords?: string;
};

export const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/admin", label: "گشتی", icon: LayoutDashboard, keywords: "سەرەکی ماڵەوە home" }] },
  {
    label: "ناوەڕۆکی ماڵپەڕ",
    items: [
      { href: "/admin/profile", label: "پرۆفایل", icon: UserRound, permission: PERMISSIONS.profileManage },
      {
        href: "/admin/museums",
        label: "بەشەکانی مۆزەخانە",
        shortLabel: "بەشەکان",
        icon: BookOpen,
        permission: PERMISSIONS.museumsManage,
      },
      {
        href: "/admin/museumhistory",
        label: "مێژووی مۆزەخانە",
        icon: CalendarClock,
        permission: PERMISSIONS.museumHistoryManage,
      },
      { href: "/admin/gallery", label: "گەلەری", icon: Images, permission: PERMISSIONS.galleryManage },
    ],
  },
  {
    label: "داواکارییەکان",
    items: [
      {
        href: "/admin/bookings",
        label: "سەردانەکان",
        shortLabel: "سەردان",
        icon: Ticket,
        permission: PERMISSIONS.bookingsManage,
      },
      {
        href: "/admin/messages",
        label: "پەیامەکان",
        shortLabel: "پەیام",
        icon: Inbox,
        permission: PERMISSIONS.messagesManage,
      },
      {
        href: "/admin/whatsapp",
        label: "پەیامەکانی واتساپ",
        shortLabel: "واتساپ",
        icon: MessageCircle,
        permission: PERMISSIONS.bookingsManage,
        keywords: "whatsapp پەیامی پەسەندکردن",
      },
    ],
  },
  {
    label: "بەڕێوەبردنی سیستم",
    items: [
      { href: "/admin/users", label: "بەکارهێنەران", icon: Users, permission: PERMISSIONS.usersManage },
      { href: "/admin/audit-logs", label: "تۆمارەکانی چاودێری", icon: ClipboardList, permission: PERMISSIONS.auditView },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/admin/settings",
  label: "ڕێکخستنەکان",
  icon: Settings,
  permission: PERMISSIONS.settingsManage,
};

// Five items get a permanent slot in the phone bottom bar (followed by the
// «زیاتر» sheet trigger — six cells total); everything else lives behind
// the «زیاتر» sheet. The notification bell lives in the header instead.
export const MOBILE_PRIMARY = new Set([
  "/admin",
  "/admin/museums",
  "/admin/gallery",
  "/admin/bookings",
  "/admin/messages",
]);

// The everyday "make something" / "change a setting" jumps — shown as
// shortcut tiles on the overview and as actions in the command palette.
export const QUICK_ACTIONS: NavItem[] = [
  {
    href: "/admin/gallery/new",
    label: "زیادکردنی وێنە",
    icon: ImagePlus,
    permission: PERMISSIONS.galleryManage,
    keywords: "گەلەری نوێ",
  },
  {
    href: "/admin/museums/blocks/new",
    label: "زیادکردنی بەش",
    icon: BookPlus,
    permission: PERMISSIONS.museumsManage,
    keywords: "بەشەکانی مۆزەخانە نوێ",
  },
  {
    href: "/admin/museumhistory/new",
    label: "زیادکردنی ڕووداو",
    icon: CalendarPlus,
    permission: PERMISSIONS.museumHistoryManage,
    keywords: "مێژووی مۆزەخانە نوێ",
  },
  {
    href: "/admin/bookings/schedule",
    label: "خشتەی سەردان",
    icon: CalendarCog,
    permission: PERMISSIONS.bookingsManage,
    keywords: "ڕۆژ و کاتەکانی سەردان",
  },
  {
    href: "/admin/bookings/categories",
    label: "جۆرەکانی سەردان",
    icon: Tags,
    permission: PERMISSIONS.bookingsManage,
  },
  {
    href: "/admin/gallery-categories",
    label: "پۆلەکانی گەلەری",
    icon: Tags,
    permission: PERMISSIONS.galleryManage,
  },
];

export function canSee(permissions: string[], item: NavItem): boolean {
  return !item.permission || hasPermission(permissions, item.permission);
}

/** The nav as one role sees it: groups with nothing visible are dropped. */
export function visibleNav(permissions: string[]) {
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(permissions, item)),
  })).filter((group) => group.items.length > 0);
  const showSettings = canSee(permissions, SETTINGS_ITEM);
  const items: NavItem[] = [...groups.flatMap((g) => g.items), ...(showSettings ? [SETTINGS_ITEM] : [])];
  return { groups, showSettings, items };
}

/** Plain prefix match on purpose: it's what keeps گەلەری highlighted on
 * /admin/gallery-categories, which has no nav entry of its own. */
export function isActiveHref(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
