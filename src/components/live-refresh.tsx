"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders server data while runs are in flight. */
export function LiveRefresh({ ms = 1500 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [router, ms]);
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-pine-soft px-3 py-2 text-[12.5px] text-pine">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-pine" />
      </span>
      Evaluations running — results update live.
    </div>
  );
}
