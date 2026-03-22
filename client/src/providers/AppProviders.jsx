import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#08275f",
            border: "1px solid rgba(255, 250, 205, 0.18)",
            borderRadius: "18px",
            boxShadow: "0 22px 48px rgba(8, 39, 95, 0.24)",
            color: "#fffef8",
          },
        }}
      />
    </QueryClientProvider>
  );
}
