import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseOtpCooldownOptions = {
  storageKey: string;
  cooldownSeconds?: number;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function useOtpCooldown({ storageKey, cooldownSeconds = 60 }: UseOtpCooldownOptions) {
  const [timeLeft, setTimeLeft] = useState(0);
  const expiryRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const expiry = raw ? Number(raw) : 0;
        expiryRef.current = Number.isFinite(expiry) ? expiry : 0;

        if (!mounted) return;
        const next = Math.max(0, expiryRef.current - nowSeconds());
        setTimeLeft(next);
      } catch {
        expiryRef.current = 0;
        if (mounted) setTimeLeft(0);
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, expiryRef.current - nowSeconds());
      setTimeLeft(next);
      if (next <= 0 && expiryRef.current !== 0) {
        expiryRef.current = 0;
        AsyncStorage.removeItem(storageKey).catch(() => undefined);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [storageKey]);

  const startCooldown = useCallback(async () => {
    const expiry = nowSeconds() + cooldownSeconds;
    expiryRef.current = expiry;
    setTimeLeft(cooldownSeconds);
    try {
      await AsyncStorage.setItem(storageKey, String(expiry));
    } catch {
      // no-op: cooldown still applies in memory for this session
    }
  }, [cooldownSeconds, storageKey]);

  const clearCooldown = useCallback(async () => {
    expiryRef.current = 0;
    setTimeLeft(0);
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch {
      // no-op
    }
  }, [storageKey]);

  const canResend = useMemo(() => timeLeft <= 0, [timeLeft]);

  return {
    canResend,
    timeLeft,
    startCooldown,
    clearCooldown,
  };
}
