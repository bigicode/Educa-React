import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

function AuthGuardFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-card w-full max-w-md rounded-[28px] p-8 text-center">
        <p className="eyebrow">Authenticating</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
          Preparing your workspace
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-700)]">
          We are restoring your session and confirming dashboard access.
        </p>
      </div>
    </main>
  );
}

export function RequireAuth() {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <AuthGuardFallback />;
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return <AuthGuardFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
