"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DISCOVERY_COOLDOWN_MS,
  DISCOVERY_PICK_MS,
} from "@/lib/discovery-pacing";

export function useDiscoveryPick<T extends { slug: string }>({
  initial,
  fetchUrl,
  pickMs = DISCOVERY_PICK_MS,
  cooldownMs = DISCOVERY_COOLDOWN_MS,
}: {
  initial: T;
  fetchUrl: (excludeSlug: string) => string;
  pickMs?: number;
  cooldownMs?: number;
}) {
  const [item, setItem] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [pickSecondsLeft, setPickSecondsLeft] = useState(0);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const pickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPickTimer = useCallback(() => {
    if (pickIntervalRef.current) {
      clearInterval(pickIntervalRef.current);
      pickIntervalRef.current = null;
    }
  }, []);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPickTimer();
      clearCooldownTimer();
    };
  }, [clearPickTimer, clearCooldownTimer]);

  const startCooldown = useCallback(() => {
    clearCooldownTimer();
    setCooldownSecondsLeft(Math.ceil(cooldownMs / 1000));

    const startedAt = Date.now();
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
      setCooldownSecondsLeft(remaining);
      if (remaining === 0) clearCooldownTimer();
    }, 200);
  }, [clearCooldownTimer, cooldownMs]);

  const pickAnother = useCallback(async () => {
    if (picking || cooldownSecondsLeft > 0) return;

    setPicking(true);
    setPickSecondsLeft(Math.ceil(pickMs / 1000));

    const startedAt = Date.now();
    pickIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((pickMs - elapsed) / 1000));
      setPickSecondsLeft(remaining);
    }, 200);

    try {
      const [response] = await Promise.all([
        fetch(fetchUrl(item.slug)),
        new Promise((resolve) => setTimeout(resolve, pickMs)),
      ]);

      if (response.ok) {
        const next = (await response.json()) as T;
        setItem(next);
      }
    } catch {
      // Keep current item on failure
    } finally {
      clearPickTimer();
      setPicking(false);
      setPickSecondsLeft(0);
      startCooldown();
    }
  }, [picking, cooldownSecondsLeft, item.slug, fetchUrl, clearPickTimer, startCooldown, pickMs]);

  const canPickAgain = !picking && cooldownSecondsLeft === 0;

  return {
    item,
    picking,
    pickSecondsLeft,
    cooldownSecondsLeft,
    canPickAgain,
    pickAnother,
  };
}
