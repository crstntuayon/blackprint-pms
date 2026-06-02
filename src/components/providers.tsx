"use client";

import { SessionProvider } from "next-auth/react";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <SessionProvider>{children}</SessionProvider>;
}
