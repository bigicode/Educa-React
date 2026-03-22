import { motion, useReducedMotion } from "motion/react";
import { useOutlet } from "react-router-dom";
import { PageTransition } from "../components/ux/PageTransition";
import { getRevealMotion } from "../lib/motion";

export function AuthLayout() {
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const panelMotion = getRevealMotion(reduceMotion, { y: 18, delay: 0.08, scale: 0.98 });

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
      <div className="brand-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-[-7rem] top-[-7rem] h-72 w-72 rounded-full bg-[#fffacd] opacity-45 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-[#0047ab]/10 blur-3xl"
        aria-hidden="true"
      />
      <motion.div
        className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center"
        {...panelMotion}
      >
        <PageTransition>{outlet}</PageTransition>
      </motion.div>
    </main>
  );
}
