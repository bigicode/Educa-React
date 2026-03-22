import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NavLink } from "react-router-dom";
import { BrandMark } from "../BrandMark";
import { getRevealMotion } from "../../lib/motion";
import { cn } from "../../lib/utils";
import { navigationSections } from "./dashboardShellConfig";

export function DashboardSidebar({ isCollapsed, isMobileOpen, onRequestClose }) {
  const reduceMotion = useReducedMotion();
  const sidebarMotion = getRevealMotion(reduceMotion, { y: 0, delay: 0.05 });
  const [hoveredItem, setHoveredItem] = useState(null);

  function showTooltip(event, label) {
    if (!isCollapsed) {
      return;
    }

    const { top, height } = event.currentTarget.getBoundingClientRect();
    setHoveredItem({
      label,
      left: event.currentTarget.getBoundingClientRect().right + 14,
      top: top + height / 2,
    });
  }

  function hideTooltip() {
    setHoveredItem(null);
  }

  return (
    <>
      <AnimatePresence>
        {isMobileOpen ? (
          <motion.button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-[#06122b]/38 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onRequestClose}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "sidebar-panel fixed inset-y-4 left-4 z-50 flex h-[calc(100vh-2rem)] flex-col gap-4 overflow-visible rounded-[34px] p-4 transition-[width,transform,padding] duration-300 lg:sticky lg:top-6 lg:left-auto lg:h-[calc(100vh-3rem)] lg:self-start lg:p-5",
          "w-[290px]",
          isCollapsed ? "lg:w-[96px]" : "lg:w-[296px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-[118%] lg:translate-x-0",
        )}
        {...sidebarMotion}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-start")}>
          <BrandMark variant="dark" compact={isCollapsed} />
        </div>

        <div className="mx-1 h-px bg-white/10" />

        <div className="sidebar-nav-scroll min-h-0 flex-1 pr-1">
          <nav className="space-y-4 pb-1">
            {navigationSections.map((section) => (
              <div key={section.label} className="space-y-2">
                {!isCollapsed ? (
                  <p className="px-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#afc2ec]">
                    {section.label}
                  </p>
                ) : null}

                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      end={item.to === "/dashboard"}
                      onClick={() => {
                        hideTooltip();
                        onRequestClose();
                      }}
                      onMouseEnter={(event) => showTooltip(event, item.name)}
                      onMouseLeave={hideTooltip}
                      onFocus={(event) => showTooltip(event, item.name)}
                      onBlur={hideTooltip}
                      aria-label={item.name}
                      className={({ isActive }) =>
                        cn(
                          "sidebar-nav-link flex rounded-2xl border py-3.5 text-sm font-semibold transition-all duration-200",
                            isCollapsed ? "justify-center px-3" : "items-center gap-3 px-4",
                            isActive ? "sidebar-nav-link--active" : "sidebar-nav-link--inactive",
                          )
                        }
                      >
                        <Icon size={18} />
                        {!isCollapsed ? <span>{item.name}</span> : null}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <AnimatePresence>
          {isCollapsed && hoveredItem ? (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.96 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
              className="sidebar-nav-tooltip hidden lg:block"
              style={{ left: hoveredItem.left, top: hoveredItem.top }}
            >
              {hoveredItem.label}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
