import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Outlet } from "react-router-dom";
import { SplashScreen } from "../components/ux/SplashScreen";
import { useSessionSplash } from "../hooks/useSessionSplash";
import { getRootShellMotion, splashDurationMs } from "../lib/motion";

export function App() {
  const reduceMotion = useReducedMotion();
  const { showSplash, isReady } = useSessionSplash(reduceMotion ? 650 : splashDurationMs);
  const shellMotion = getRootShellMotion(reduceMotion);

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="startup-splash" />
      ) : isReady ? (
        <motion.div key="app-shell" {...shellMotion} className="min-h-screen">
          <Outlet />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
