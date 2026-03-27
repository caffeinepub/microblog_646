import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Check,
  Home,
  LogOut,
  Moon,
  MoreHorizontal,
  Music,
  PlusCircle,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useActiveProfile } from "../contexts/ActiveProfileContext";
import { useArtistPage } from "../hooks/useArtistPageQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useProfile, useUnreadNotificationCount } from "../hooks/useQueries";
import { getInitials } from "../utils/formatting";
import { CreateArtistProfileDialog } from "./CreateArtistProfileDialog";

const STATIC_NAV_ITEMS = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Search", icon: Search, to: "/search" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
] as const;

function isNavActive(itemTo: string, currentPath: string): boolean {
  if (itemTo === "/") return currentPath === "/";
  if (itemTo === "/search")
    return (
      currentPath.startsWith("/search") || currentPath.startsWith("/hashtag/")
    );
  return currentPath.startsWith(itemTo);
}

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const queryClient = useQueryClient();
  const { clear } = useInternetIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateArtistOpen, setIsCreateArtistOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    queryClient.clear();
    clear();
    setIsOpen(false);
  };

  const { data: profile, isError: isProfileError } = useProfile();
  const { data: artistPage } = useArtistPage();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { theme, setTheme } = useTheme();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { activeProfile } = useActiveProfile();

  // Close popup on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const profilePictureUrl = profile?.profilePictureHash
    ? profile.profilePictureHash.getDirectURL()
    : null;
  const artistPictureUrl = artistPage?.profilePictureHash
    ? artistPage.profilePictureHash.getDirectURL()
    : null;

  const fanInitials = profile?.displayName
    ? getInitials(profile.displayName)
    : "?";

  // Active account display info
  const activeAvatarUrl =
    activeProfile === "artist" ? artistPictureUrl : profilePictureUrl;
  const activeDisplayName =
    activeProfile === "artist" ? artistPage?.bandName : profile?.displayName;
  const activeSubLabel =
    activeProfile === "artist" && artistPage?.username
      ? `@${artistPage.username}`
      : profile?.username
        ? `@${profile.username}`
        : "";
  const activeInitials = activeProfile === "artist" ? undefined : fanInitials;

  // Fan profile link
  const fanProfilePath = profile?.username ? `/${profile.username}` : null;

  // Artist profile link
  const artistProfilePath = artistPage?.username
    ? `/artist/${artistPage.username}`
    : null;

  // Profile link based on active profile
  const activeProfilePath =
    activeProfile === "artist" ? artistProfilePath : fanProfilePath;

  const isActiveProfileLinkActive = activeProfilePath
    ? currentPath === activeProfilePath
    : false;

  const isDark = theme === "dark";
  const logoSrc = isDark
    ? "/assets/uploads/500x500_white-019d3123-4890-718e-9677-93c6a279a4f3-1.png"
    : "/assets/uploads/500x500_black-019d3123-488b-753b-999d-c145f9c55303-2.png";

  const switchToFan = () => {
    try {
      localStorage.setItem("bandspace_active_profile", "fan");
    } catch {}
    setIsSwitching(true);
    const target = `${window.location.origin}${window.location.pathname}#/`;
    setTimeout(() => {
      window.location.replace(target);
    }, 80);
  };

  const switchToArtist = (username: string) => {
    try {
      localStorage.setItem("bandspace_active_profile", "artist");
    } catch {}
    setIsSwitching(true);
    const target = `${window.location.origin}${window.location.pathname}#/artist/${username}`;
    setTimeout(() => {
      window.location.replace(target);
    }, 80);
  };

  return (
    <>
      {/* Full-screen logo splash shown during profile switch */}
      {isSwitching && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          data-ocid="sidebar.switching.loading_state"
        >
          <img
            src={logoSrc}
            alt="Indie City Social"
            width={120}
            height={120}
            style={{ width: 120, height: 120, objectFit: "contain" }}
          />
        </div>
      )}

      <div className="flex h-full flex-col">
        <div className="px-3 pt-5 pb-6">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-1 transition-opacity hover:opacity-80"
            onClick={onNavigate}
          >
            <span className="text-xl font-bold tracking-tight">
              Indie City Social
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {STATIC_NAV_ITEMS.map((item) => {
              const active = isNavActive(item.to, currentPath);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-4 py-3 text-[15px] transition-colors",
                      active
                        ? "font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    onClick={onNavigate}
                    data-ocid={`nav.${item.label.toLowerCase()}.link`}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active && "stroke-[2.5px]",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.to === "/notifications" &&
                      !!unreadCount &&
                      unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                  </Link>
                </li>
              );
            })}

            {/* Single profile link — shows "Profile" for fan, "Artist Profile" for artist */}
            {activeProfilePath && (
              <li>
                <Link
                  to={activeProfilePath as string}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-[15px] transition-colors",
                    isActiveProfileLinkActive
                      ? "font-bold text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  onClick={onNavigate}
                  data-ocid={
                    activeProfile === "artist"
                      ? "nav.artist_profile.link"
                      : "nav.profile.link"
                  }
                >
                  {activeProfile === "artist" ? (
                    <Music
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActiveProfileLinkActive && "stroke-[2.5px]",
                      )}
                    />
                  ) : (
                    <User
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActiveProfileLinkActive && "stroke-[2.5px]",
                      )}
                    />
                  )}
                  <span className="flex-1">
                    {activeProfile === "artist" ? "Artist Profile" : "Profile"}
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Account switcher */}
        {!isProfileError && (
          <div ref={containerRef} className="relative mt-2 px-3 pb-3">
            {/* Popup card */}
            {isOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 z-50 overflow-hidden rounded-2xl border bg-popover shadow-lg">
                {/* Fan account row */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                  onClick={switchToFan}
                  data-ocid="sidebar.fan_account.button"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {profilePictureUrl && (
                      <AvatarImage
                        src={profilePictureUrl}
                        alt={profile?.displayName ?? ""}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {fanInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-semibold">
                      {profile?.displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      @{profile?.username}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {unreadCount !== undefined &&
                      unreadCount > 0 &&
                      activeProfile !== "fan" && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-semibold text-white">
                          {unreadCount > 99 ? "99+" : String(unreadCount)}
                        </span>
                      )}
                    {activeProfile === "fan" && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </button>

                {/* Artist account row */}
                {artistPage && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                    onClick={() => switchToArtist(artistPage.username)}
                    data-ocid="sidebar.artist_account.button"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {artistPictureUrl && (
                        <AvatarImage
                          src={artistPictureUrl}
                          alt={artistPage.bandName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                        <Music className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-sm font-semibold">
                        {artistPage.bandName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        @{artistPage.username}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {activeProfile === "artist" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </button>
                )}

                <Separator />

                {/* Create Artist Page button — shown only when no artist page exists */}
                {!artistPage && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => {
                      setIsCreateArtistOpen(true);
                      setIsOpen(false);
                    }}
                    data-ocid="sidebar.create_artist.button"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Artist Page
                  </button>
                )}

                {/* Theme toggle */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setIsOpen(false);
                  }}
                  data-ocid="sidebar.theme.toggle"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>

                {/* Log out */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                  onClick={handleLogout}
                  data-ocid="sidebar.logout.button"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}

            {/* Bottom bar — active account */}
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-left transition-colors hover:bg-accent"
              onClick={() => setIsOpen((prev) => !prev)}
              data-ocid="sidebar.account_switcher.button"
            >
              <Avatar className="h-9 w-9 shrink-0">
                {activeAvatarUrl && (
                  <AvatarImage
                    src={activeAvatarUrl}
                    alt={activeDisplayName ?? ""}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {activeProfile === "artist" ? (
                    <Music className="h-3.5 w-3.5" />
                  ) : (
                    activeInitials
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">
                  {activeDisplayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeSubLabel}
                </span>
              </div>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Create Artist Profile Dialog */}
        <CreateArtistProfileDialog
          open={isCreateArtistOpen}
          onOpenChange={setIsCreateArtistOpen}
        />
      </div>
    </>
  );
}
