"use client";

import { useEffect, useRef } from "react";

export function Transcript({ children }: { children?: React.ReactNode }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [children]);

  return (
    <div className="space-y-4">
      {children}
      <div ref={endRef} />
    </div>
  );
}
