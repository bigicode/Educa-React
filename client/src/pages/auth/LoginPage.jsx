import {
  ArrowRight,
  BookOpenCheck,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "../../components/BrandMark";

const featureCards = [
  {
    title: "Attendance",
    copy: "Track presence, lateness, and class-level trends from one panel.",
    icon: BookOpenCheck,
  },
  {
    title: "Security",
    copy: "Professional auth screens with cleaner hierarchy and calmer visual trust.",
    icon: ShieldCheck,
  },
  {
    title: "School Roles",
    copy: "Designed to expand naturally for admins, teachers, students, and parents.",
    icon: UsersRound,
  },
];

export function LoginPage() {
  return (
    <section className="surface-card w-full max-w-6xl overflow-hidden rounded-[36px]">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(155deg,#08275f_0%,#0047ab_55%,#0b367e_100%)] p-8 text-white md:p-10">
          <div
            className="pointer-events-none absolute right-[-3rem] top-[-4rem] h-48 w-48 rounded-full bg-[#fffacd]/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-[-4rem] left-[-3rem] h-52 w-52 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <BrandMark variant="dark" />

            <div>
              <p className="eyebrow text-[#fffacd]">School Platform</p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
                Professional, warm, and built for academic trust.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#d9e5ff]">
                Your palette now leans into school credibility: royal blue gives structure and
                authority, while cream softens the interface so it feels welcoming rather than
                cold.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {featureCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm"
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-[#fffacd]/16 p-3 text-[#fffacd]">
                      <Icon size={20} />
                    </div>
                    <h2 className="font-display text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#d9e5ff]">{item.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.84)] p-8 md:p-10">
          <div className="mb-8">
            <p className="eyebrow">Sign In</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
              Welcome back
            </h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-[var(--ink-700)]">
              The visual language is now configured. We will connect this form to the real
              authentication flow in the next backend step.
            </p>
          </div>

          <form className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--ink-900)]">Email address</span>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7b94]"
                  size={18}
                />
                <input
                  type="email"
                  className="form-input pl-11"
                  placeholder="admin@educa.school"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-[var(--ink-900)]">Password</span>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7b94]"
                  size={18}
                />
                <input
                  type="password"
                  className="form-input pl-11"
                  placeholder="Enter your password"
                />
              </div>
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm text-[var(--ink-700)]">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--brand-blue-700)] transition hover:text-[var(--brand-blue-900)]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="button"
              className="primary-button inline-flex w-full items-center justify-center gap-2"
            >
              <span>Sign in</span>
              <ArrowRight size={18} />
            </button>

            <button type="button" className="secondary-button w-full">
              Continue with school account
            </button>
          </form>

          <div className="mt-8 rounded-[24px] border border-[rgba(8,39,95,0.08)] bg-[rgba(255,250,205,0.44)] p-5">
            <p className="text-sm font-semibold text-[var(--brand-blue-900)]">Theme note</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
              Cream is used as a soft academic accent, not a loud background color. That keeps
              the interface polished and readable while still honoring your brand choice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
