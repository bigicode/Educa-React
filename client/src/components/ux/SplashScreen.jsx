import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { BrandMark } from "../BrandMark";
import { motionEase } from "../../lib/motion";

export function SplashScreen() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="fixed inset-0 z-[120] overflow-hidden bg-[linear-gradient(160deg,#031537_0%,#08275f_40%,#0047ab_100%)] text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: {
          duration: reduceMotion ? 0.18 : 0.42,
          ease: motionEase.exit,
        },
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#fffacd]/28 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.7, 0.9, 0.7],
              }
        }
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.2, 0.34, 0.2],
              }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: reduceMotion ? 0.18 : 0.58,
              ease: motionEase.entrance,
            },
          }}
          className="w-full max-w-2xl rounded-[36px] border border-white/12 bg-white/8 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-10"
        >
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <motion.div
                className="absolute inset-[-16px] rounded-[32px] border border-[#fffacd]/26"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scale: [1, 1.07, 1],
                        opacity: [0.65, 1, 0.65],
                      }
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                aria-hidden="true"
              />
              <BrandMark variant="dark" className="justify-center" />
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: reduceMotion ? 0.18 : 0.48,
                delay: reduceMotion ? 0 : 0.08,
                ease: motionEase.entrance,
              },
            }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#fffacd]">
              <Sparkles size={14} />
              <span>Preparing Workspace</span>
            </p>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl">
              Opening your academic command center
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#dbe7ff]">
              A short branded startup keeps the first impression polished, then hands off quickly
              to the working dashboard.
            </p>
          </motion.div>

          <div className="mt-10">
            <div className="mx-auto h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#fffacd_0%,#f8edaa_45%,#ffffff_100%)]"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{
                  duration: reduceMotion ? 0.5 : 1.05,
                  ease: motionEase.smooth,
                }}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#dbe7ff]">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                Branding
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                Session Ready
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                UI Transition
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
