import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { DashboardSidebar } from "../components/navigation/DashboardSidebar";
import { DashboardTopbar } from "../components/navigation/DashboardTopbar";
import { getPageMeta, layoutStorageKey } from "../components/navigation/dashboardShellConfig";
import { ModalShell } from "../components/ui/ModalShell";
import { PageTransition } from "../components/ux/PageTransition";
import {
  globalSearchEntities,
  headerMessages as initialHeaderMessages,
  userProfile,
} from "../data/schoolData";

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

function matchesQuery(entity, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  return entity.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery));
}

export function DashboardLayout() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopbarVisible, setIsTopbarVisible] = useState(true);
  const [messages, setMessages] = useState(initialHeaderMessages);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const messagesRef = useRef(null);
  const userMenuRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    try {
      window.localStorage.setItem(layoutStorageKey, String(isSidebarCollapsed));
    } catch {
      // Ignore storage issues in restricted environments.
    }
  }, [isSidebarCollapsed]);

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

  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) {
      return [];
    }

    return globalSearchEntities.filter((entity) => matchesQuery(entity, deferredQuery)).slice(0, 8);
  }, [deferredQuery]);

  const unreadMessagesCount = useMemo(
    () => messages.filter((message) => message.unread).length,
    [messages],
  );

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

  function handleMessageOpen(messageId) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, unread: false } : message,
      ),
    );
    setIsMessagesOpen(false);
    navigate("/dashboard");
    toast.success("Message thread opened.");
  }

  function markAllMessagesRead() {
    setMessages((current) => current.map((message) => ({ ...message, unread: false })));
    toast.success("All messages marked as read.");
  }

  function handleLogout() {
    setIsUserMenuOpen(false);
    navigate("/login");
    toast.success("You have been signed out.");
  }

  return (
    <div className="relative min-h-screen overflow-x-clip px-4 py-4 lg:px-6 lg:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="brand-grid absolute inset-0 opacity-24" />
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#fffacd]/34 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-[#0047ab]/8 blur-3xl" />
      </div>

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
            onSearchSelect={handleSearchSelect}
            messagesRef={messagesRef}
            unreadMessagesCount={unreadMessagesCount}
            messages={messages}
            isMessagesOpen={isMessagesOpen}
            onToggleMessages={() => {
              setIsMessagesOpen((current) => !current);
              setIsUserMenuOpen(false);
            }}
            onMarkAllMessagesRead={markAllMessagesRead}
            onMessageOpen={handleMessageOpen}
            userMenuRef={userMenuRef}
            isUserMenuOpen={isUserMenuOpen}
            onToggleUserMenu={() => {
              setIsUserMenuOpen((current) => !current);
              setIsMessagesOpen(false);
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
            user={userProfile}
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
              {userProfile.name}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Role</p>
            <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
              {userProfile.role}
            </p>
          </div>
          <div className="subtle-card rounded-[24px] p-5 md:col-span-2">
            <p className="text-sm text-[var(--ink-500)]">Email</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">{userProfile.email}</p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Campus</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">{userProfile.campus}</p>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <p className="text-sm text-[var(--ink-500)]">Academic Year</p>
            <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
              {userProfile.academicYear}
            </p>
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
