"use client";

import { useEffect } from "react";

export function DashboardScrollLock() {
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");

    const apply = () => {
      if (mq.matches) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };

    apply();
    mq.addEventListener("change", apply);

    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  return null;
}
