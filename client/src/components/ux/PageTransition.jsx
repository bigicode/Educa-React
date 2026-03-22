import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router-dom";
import { getPageMotion } from "../../lib/motion";

export function PageTransition({ children }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const pageMotion = getPageMotion(reduceMotion);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} {...pageMotion} className="h-full">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

