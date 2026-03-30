"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseOtpCooldownOptions = {
  storageKey: string;
  cooldownSeconds?: number;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function useOtpCooldown({ storageKey, cooldownSeconds = 60 }: UseOtpCooldownOptions) {
  const [timeLeft, setTimeLeft] = useState(0);
  const expiryRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(storageKey);
    const expiry = raw ? Number(raw) : 0;
    expiryRef.current = Number.isFinite(expiry) ? expiry : 0;
    setTimeLeft(Math.max(0, expiryRef.current - nowSeconds()));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setInterval(() => {
      const next = Math.max(0, expiryRef.current - nowSeconds());
      setTimeLeft(next);
      if (next <= 0 && expiryRef.current !== 0) {
        expiryRef.current = 0;
        window.localStorage.removeItem(storageKey);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [storageKey]);

  const startCooldown = useCallback(() => {
    if (typeof window === "undefined") return;

    const expiry = nowSeconds() + cooldownSeconds;
    expiryRef.current = expiry;
    setTimeLeft(cooldownSeconds);
    window.localStorage.setItem(storageKey, String(expiry));
  }, [cooldownSeconds, storageKey]);

  const clearCooldown = useCallback(() => {
    if (typeof window === "undefined") return;

    expiryRef.current = 0;
    setTimeLeft(0);
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  const canResend = useMemo(() => timeLeft <= 0, [timeLeft]);

  return {
    canResend,
    timeLeft,
    startCooldown,
    clearCooldown,
  };
}
