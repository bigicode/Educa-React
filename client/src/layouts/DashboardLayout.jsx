import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { DashboardSidebar } from "../components/navigation/DashboardSidebar";
import { DashboardTopbar } from "../components/navigation/DashboardTopbar";
import { getPageMeta, layoutStorageKey } from "../components/navigation/dashboardShellConfig";
import { ModalShell } from "../components/ui/ModalShell";
import { PageTransition } from "../components/ux/PageTransition";
import { useAuth } from "../features/auth/useAuth";
import {
  fetchNotificationsOverview,
  getApiErrorMessage as getNotificationsApiErrorMessage,
} from "../features/notifications/api";
import {
  fetchGlobalSearchResults,
  getApiErrorMessage as getSearchApiErrorMessage,
} from "../features/search/api";
import {
  persistTopbarReadState,
  readTopbarReadState,
} from "../features/notifications/storage";

function getInitialSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(layoutStorageKey) === "true";
  } catch {
    return false;
  }
}

export function DashboardLayout() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopbarVisible, setIsTopbarVisible] = useState(true);
  const [readStateByUser, setReadStateByUser] = useState({});
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const messagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const deferredQuery = useDeferredValue(searchQuery);
  const persistedReadState = useMemo(() => readTopbarReadState(user?.id), [user?.id]);
  const activeReadState = readStateByUser[user?.id] || persistedReadState;

  const topbarOverviewQuery = useQuery({
    queryKey: ["notifications", "overview"],
    queryFn: fetchNotificationsOverview,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const liveSearchQuery = useQuery({
    queryKey: ["search", "global", deferredQuery.trim()],
    queryFn: () => fetchGlobalSearchResults(deferredQuery.trim()),
    enabled: Boolean(user?.id && deferredQuery.trim().length >= 2),
    staleTime: 30_000,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(layoutStorageKey, String(isSidebarCollapsed));
    } catch {
      // Ignore storage issues in restricted environments.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    persistTopbarReadState(user?.id, activeReadState);
  }, [activeReadState, user?.id]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }

      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setIsMessagesOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsMessagesOpen(false);
        setIsNotificationsOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    function updateTopbarVisibility() {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const isNearTop = currentScrollY < 24;

      if (isNearTop) {
        setIsTopbarVisible(true);
      } else if (Math.abs(scrollDelta) > 10) {
        if (scrollDelta > 0) {
          setIsTopbarVisible(false);
          setIsSearchOpen(false);
          setIsMessagesOpen(false);
          setIsNotificationsOpen(false);
          setIsUserMenuOpen(false);
        } else {
          setIsTopbarVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
      ticking = false;
    }

    function handleScroll() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateTopbarVisibility);
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const currentPage = useMemo(() => getPageMeta(location.pathname), [location.pathname]);

  const searchResults = useMemo(
    () => liveSearchQuery.data || [],
    [liveSearchQuery.data],
  );

  const liveMessages = useMemo(() => {
    const baseMessages = topbarOverviewQuery.data?.messages || [];
    const readIds = new Set(activeReadState.messages);

    return baseMessages.map((message) => ({
      ...message,
      unread: !readIds.has(message.id),
    }));
  }, [activeReadState.messages, topbarOverviewQuery.data?.messages]);

  const liveNotifications = useMemo(() => {
    const baseNotifications = topbarOverviewQuery.data?.notifications || [];
    const readIds = new Set(activeReadState.notifications);

    return baseNotifications.map((notification) => ({
      ...notification,
      unread: !readIds.has(notification.id),
    }));
  }, [activeReadState.notifications, topbarOverviewQuery.data?.notifications]);

  const unreadMessagesCount = useMemo(
    () => liveMessages.filter((message) => message.unread).length,
    [liveMessages],
  );

  const unreadNotificationsCount = useMemo(
    () => liveNotifications.filter((notification) => notification.unread).length,
    [liveNotifications],
  );

  const dashboardUser = useMemo(
    () => ({
      initials: user?.initials || "US",
      name: user?.name || "Unknown User",
      role: user?.role || "User",
      email: user?.email || "No email",
      academicYear: user?.academicYear || "Not configured",
      isActive: user?.isActive ?? false,
      id: user?.id || "Unavailable",
    }),
    [user],
  );

  const topbarFeedError = useMemo(
    () =>
      getNotificationsApiErrorMessage(
        topbarOverviewQuery.error,
        "Could not load the live top bar updates right now.",
      ),
    [topbarOverviewQuery.error],
  );
  const searchError = useMemo(
    () =>
      getSearchApiErrorMessage(
        liveSearchQuery.error,
        "Could not load the global search results right now.",
      ),
    [liveSearchQuery.error],
  );

  function markItemsAsRead(group, itemIds) {
    if (!user?.id) {
      return;
    }

    setReadStateByUser((current) => {
      const currentUserState = current[user.id] || persistedReadState;

      return {
        ...current,
        [user.id]: {
          ...currentUserState,
          [group]: Array.from(new Set([...(currentUserState[group] || []), ...itemIds])),
        },
      };
    });
  }

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setIsSidebarCollapsed((current) => !current);
      return;
    }

    setIsMobileSidebarOpen((current) => !current);
  }

  function handleSearchQueryChange(value) {
    setSearchQuery(value);
    setIsSearchOpen(true);
  }

  function handleSearchSelect(entity) {
    navigate(entity.route);
    setSearchQuery("");
    setIsSearchOpen(false);
    toast.success(`Opened ${entity.title}`);
  }

  function handleMessageOpen(message) {
    markItemsAsRead("messages", [message.id]);
    setIsMessagesOpen(false);
    navigate(message.route || "/dashboard/communication");
    toast.success("Communication update opened.");
  }

  function markAllMessagesRead() {
    markItemsAsRead(
      "messages",
      liveMessages.map((message) => message.id),
    );
    toast.success("All messages marked as read.");
  }

  function handleNotificationOpen(notification) {
    markItemsAsRead("notifications", [notification.id]);
    setIsNotificationsOpen(false);
    navigate(notification.route || "/dashboard");
    toast.success("Operational alert opened.");
  }

  function markAllNotificationsRead() {
    markItemsAsRead(
      "notifications",
      liveNotifications.map((notification) => notification.id),
    );
    toast.success("All notifications marked as read.");
  }

  function handleLogout() {
    setIsUserMenuOpen(false);
    logout();
    navigate("/login");
    toast.success("You have been signed out.");
  }

  return (
    <div className="relative min-h-screen overflow-x-clip px-4 py-4 lg:px-6 lg:py-6">
      <div className="relative mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onRequestClose={() => setIsMobileSidebarOpen(false)}
        />

        <div className="min-w-0">
          <DashboardTopbar
            currentPage={currentPage}
            isSidebarCollapsed={isSidebarCollapsed}
            isVisible={isTopbarVisible}
            onToggleSidebar={toggleSidebar}
            searchContainerRef={searchContainerRef}
            searchInputRef={searchInputRef}
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            isSearchOpen={isSearchOpen}
            onSearchOpen={() => setIsSearchOpen(true)}
            searchResults={searchResults}
            searchLoading={liveSearchQuery.isPending && deferredQuery.trim().length >= 2}
            searchError={liveSearchQuery.isError ? searchError : ""}
            onSearchSelect={handleSearchSelect}
            messagesRef={messagesRef}
            unreadMessagesCount={unreadMessagesCount}
            messages={liveMessages}
            messagesLoading={topbarOverviewQuery.isPending && !topbarOverviewQuery.data}
            messagesError={topbarOverviewQuery.isError ? topbarFeedError : ""}
            isMessagesOpen={isMessagesOpen}
            onToggleMessages={() => {
              setIsMessagesOpen((current) => !current);
              setIsNotificationsOpen(false);
              setIsUserMenuOpen(false);
            }}
            onMarkAllMessagesRead={markAllMessagesRead}
            onMessageOpen={handleMessageOpen}
            notificationsRef={notificationsRef}
            unreadNotificationsCount={unreadNotificationsCount}
            notifications={liveNotifications}
            notificationsLoading={topbarOverviewQuery.isPending && !topbarOverviewQuery.data}
            notificationsError={topbarOverviewQuery.isError ? topbarFeedError : ""}
            isNotificationsOpen={isNotificationsOpen}
            onToggleNotifications={() => {
              setIsNotificationsOpen((current) => !current);
              setIsMessagesOpen(false);
              setIsUserMenuOpen(false);
            }}
            onMarkAllNotificationsRead={markAllNotificationsRead}
            onNotificationOpen={handleNotificationOpen}
            userMenuRef={userMenuRef}
            isUserMenuOpen={isUserMenuOpen}
            onToggleUserMenu={() => {
              setIsUserMenuOpen((current) => !current);
              setIsMessagesOpen(false);
              setIsNotificationsOpen(false);
            }}
            onOpenProfile={() => {
              setIsUserMenuOpen(false);
              setIsProfileOpen(true);
            }}
            onOpenSettings={() => {
              setIsUserMenuOpen(false);
              setIsSettingsOpen(true);
            }}
            onLogout={handleLogout}
            user={dashboardUser}
          />

          <main className="min-w-0 pb-8 pt-5">
            <PageTransition>{outlet}</PageTransition>
          </main>
        </div>
      </div>

      <ModalShell
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Profile"
        description="Your current account and school access details."
        footer={
          <button type="button" className="secondary-button" onClick={() => setIsProfileOpen(false)}>
            Close
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Name</p>
            <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
              {dashboardUser.name}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Role</p>
            <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
              {dashboardUser.role}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5 md:col-span-2">
            <p className="text-sm text-[var(--ink-500)]">Email</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">{dashboardUser.email}</p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Account Status</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
              {dashboardUser.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Academic Year</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
              {dashboardUser.academicYear}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5 md:col-span-2">
            <p className="text-sm text-[var(--ink-500)]">User ID</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">{dashboardUser.id}</p>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Workspace Settings"
        description="A few shell preferences you can control immediately from the dashboard."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setIsSettingsOpen(false)}>
              Close
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setIsSidebarCollapsed((current) => !current);
                toast.success("Sidebar preference updated.");
              }}
            >
              Toggle sidebar size
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="subtle-card rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl font-semibold text-[var(--ink-900)]">
                  Sidebar preference
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                  Choose whether the admin workspace should open in compact or full sidebar mode.
                </p>
              </div>
              <span className="status-chip status-chip--blue">
                {isSidebarCollapsed ? "Compact" : "Expanded"}
              </span>
            </div>
          </div>

          <div className="subtle-card rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-[var(--brand-blue-700)]" size={18} />
              <div>
                <p className="font-display text-xl font-semibold text-[var(--ink-900)]">
                  Header style
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                  The top bar uses glass with blur and transparency so the chrome stays separated
                  while the page content flows naturally underneath.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
