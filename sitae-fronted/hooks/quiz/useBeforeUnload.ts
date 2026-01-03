// app/curso/[id]/quiz/[quizId]/_hooks/useBeforeUnload.ts
"use client";

import { useEffect } from "react";

export function useBeforeUnload(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn]);
}