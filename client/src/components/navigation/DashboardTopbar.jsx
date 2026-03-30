import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  MessageSquareMore,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import { motionEase } from "../../lib/motion";
import { cn } from "../../lib/utils";

export function DashboardTopbar({
  currentPage,
  isSidebarCollapsed,
  isVisible,
  onToggleSidebar,
  searchContainerRef,
  searchInputRef,
  searchQuery,
  onSearchQueryChange,
  isSearchOpen,
  onSearchOpen,
  searchResults,
  searchLoading,
  searchError,
  onSearchSelect,
  messagesRef,
  unreadMessagesCount,
  messages,
  messagesLoading,
  messagesError,
  isMessagesOpen,
  onToggleMessages,
  onMarkAllMessagesRead,
  onMessageOpen,
  notificationsRef,
  unreadNotificationsCount,
  notifications,
  notificationsLoading,
  notificationsError,
  isNotificationsOpen,
  onToggleNotifications,
  onMarkAllNotificationsRead,
  onNotificationOpen,
  userMenuRef,
  isUserMenuOpen,
  onToggleUserMenu,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  user,
}) {
  const reduceMotion = useReducedMotion();
  const toneClassMap = {
    blue: "status-chip--blue",
    cream: "status-chip--cream",
    green: "status-chip--green",
    rose: "status-chip--rose",
  };
  const headerMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: {
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : -12,
          transition: { duration: 0.18, delay: 0.14 },
        },
      }
    : {
        initial: { opacity: 0, y: -20 },
        animate: {
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : "-125%",
          transition: {
            duration: 0.24,
            delay: isVisible ? 0.14 : 0,
            ease: motionEase.smooth,
          },
        },
      };

  return (
    <motion.header
      className={cn(
        "dashboard-topbar header-panel sticky top-4 z-[60] overflow-visible rounded-[28px] px-3 py-3 sm:px-4 sm:py-4 lg:top-6 lg:px-5",
        isVisible ? "dashboard-topbar--visible" : "dashboard-topbar--hidden",
      )}
      {...headerMotion}
    >
      <div className="grid items-center gap-3 xl:grid-cols-[minmax(220px,auto)_minmax(0,1fr)_auto] xl:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="topbar-icon-button h-12 w-12 shrink-0"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
              {currentPage.label}
            </p>
          </div>
        </div>

        <form
          ref={searchContainerRef}
          className="relative min-w-0 w-full xl:mx-auto xl:max-w-2xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="topbar-search-shell">
            <Search className="topbar-search-icon" size={18} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              onFocus={onSearchOpen}
              className="topbar-search-input"
              placeholder={currentPage.searchPlaceholder}
            />
            <span className="topbar-shortcut hidden sm:inline-flex">Ctrl K</span>
          </label>

          <AnimatePresence>
            {isSearchOpen && searchQuery.trim() ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="topbar-dropdown absolute left-0 right-0 top-[calc(100%+0.8rem)] z-[70]"
              >
                <div className="topbar-dropdown__header">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue-700)]">
                      Global Search
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-700)]">
                      {searchQuery.trim().length < 2
                        ? "Type at least 2 characters to search the live system"
                        : searchLoading
                          ? "Searching live students, teachers, assessments, and notices..."
                          : searchResults.length
                        ? `${searchResults.length} matching entities`
                        : "No matching entities"}
                    </p>
                  </div>
                </div>

                <div className="topbar-dropdown__list max-h-[24rem] overflow-y-auto">
                  {searchQuery.trim().length < 2 ? (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                      Keep typing to search real students, teachers, classes, assessments, and announcements.
                    </div>
                  ) : searchLoading ? (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                      Loading live search results...
                    </div>
                  ) : searchError ? (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">{searchError}</div>
                  ) : searchResults.length ? (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="search-result-item"
                        onClick={() => onSearchSelect(result)}
                      >
                        <span className="search-result-item__content">
                          <span className="search-result-item__title">{result.title}</span>
                          <span className="search-result-item__subtitle">{result.subtitle}</span>
                        </span>
                        <span className="status-chip status-chip--blue">{result.category}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-6 text-sm text-[var(--ink-700)]">
                      Try searching for a student, teacher, subject, class, assessment, or announcement.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div ref={messagesRef} className="relative">
            <button
              type="button"
              className="topbar-icon-button relative h-12 w-12"
              aria-label="Messages"
              onClick={onToggleMessages}
            >
              <MessageSquareMore size={18} />
              {unreadMessagesCount ? <span className="topbar-badge">{unreadMessagesCount}</span> : null}
            </button>

            <AnimatePresence>
              {isMessagesOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="topbar-dropdown absolute right-0 top-[calc(100%+0.8rem)] z-[70] w-[min(92vw,24rem)]"
                >
                  <div className="topbar-dropdown__header">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue-700)]">
                      Messages
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-700)]">
                        {unreadMessagesCount} unread updates
                    </p>
                  </div>
                  <button type="button" className="chip-button" onClick={onMarkAllMessagesRead}>
                    Mark all read
                  </button>
                </div>

                <div className="topbar-dropdown__list">
                  {messagesLoading ? (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                      Loading live communication updates...
                    </div>
                  ) : messagesError ? (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">{messagesError}</div>
                  ) : messages.length ? (
                    messages.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        className="topbar-dropdown-item"
                        onClick={() => onMessageOpen(message)}
                      >
                        <div className="topbar-dropdown-item__meta">
                          <span className="font-display text-base font-semibold text-[var(--ink-900)]">
                            {message.sender}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                            {message.time}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">
                          {message.subject}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--ink-700)]">
                          {message.preview}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`status-chip ${toneClassMap[message.tone] || "status-chip--blue"}`}>
                            {message.kind}
                          </span>
                          {message.unread ? <span className="message-unread-dot" /> : null}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                      No live communication updates are waiting right now.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          </div>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              className="topbar-icon-button relative h-12 w-12"
              aria-label="Notifications"
              onClick={onToggleNotifications}
            >
              <Bell size={17} />
              {unreadNotificationsCount ? <span className="topbar-badge">{unreadNotificationsCount}</span> : null}
            </button>

            <AnimatePresence>
              {isNotificationsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="topbar-dropdown absolute right-0 top-[calc(100%+0.8rem)] z-[70] w-[min(92vw,25rem)]"
                >
                  <div className="topbar-dropdown__header">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue-700)]">
                        Alerts
                      </p>
                      <p className="mt-1 text-sm text-[var(--ink-700)]">
                        {unreadNotificationsCount} unread operations alerts
                      </p>
                    </div>
                    <button type="button" className="chip-button" onClick={onMarkAllNotificationsRead}>
                      Mark all read
                    </button>
                  </div>

                  <div className="topbar-dropdown__list">
                    {notificationsLoading ? (
                      <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                        Loading live operational alerts...
                      </div>
                    ) : notificationsError ? (
                      <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">{notificationsError}</div>
                    ) : notifications.length ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className="topbar-dropdown-item"
                          onClick={() => onNotificationOpen(notification)}
                        >
                          <div className="topbar-dropdown-item__meta">
                            <span className={`status-chip ${toneClassMap[notification.tone] || "status-chip--blue"}`}>
                              {notification.category}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                              {notification.time}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-[var(--ink-900)]">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--ink-700)]">
                            {notification.detail}
                          </p>
                          {notification.unread ? <span className="message-unread-dot" /> : null}
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-6 text-sm leading-7 text-[var(--ink-700)]">
                        No operational alerts are waiting right now.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div ref={userMenuRef} className="relative">
            <button type="button" className="user-summary" onClick={onToggleUserMenu}>
              <span className="user-summary__avatar">{user.initials}</span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-sm font-semibold text-[var(--ink-900)]">
                  {user.name}
                </span>
                <span className="block truncate text-xs text-[var(--ink-500)]">{user.role}</span>
              </span>
              <ChevronDown className="hidden text-[var(--ink-500)] sm:block" size={16} />
            </button>

            <AnimatePresence>
              {isUserMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="topbar-dropdown absolute right-0 top-[calc(100%+0.8rem)] z-[70] w-[min(92vw,19rem)]"
                >
                  <div className="topbar-dropdown__header">
                    <div className="flex items-center gap-3">
                      <span className="user-summary__avatar">{user.initials}</span>
                      <div>
                        <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                          {user.name}
                        </p>
                        <p className="text-sm text-[var(--ink-700)]">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="topbar-dropdown__list p-2">
                    <button type="button" className="menu-item" onClick={onOpenProfile}>
                      <UserRound size={17} />
                      <span>Profile</span>
                      <ChevronRight size={15} className="ml-auto text-[var(--ink-500)]" />
                    </button>

                    <button type="button" className="menu-item" onClick={onOpenSettings}>
                      <Settings2 size={17} />
                      <span>Settings</span>
                      <ChevronRight size={15} className="ml-auto text-[var(--ink-500)]" />
                    </button>

                    <button type="button" className="menu-item menu-item--danger" onClick={onLogout}>
                      <LogOut size={17} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
