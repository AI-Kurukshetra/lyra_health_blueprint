"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { NotificationAgent } from "@/components/notifications/notification-agent";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextTopLoader color="#0f766e" showSpinner={false} />
      {children}
      <Toaster richColors position="top-right" closeButton />
      <NotificationAgent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
