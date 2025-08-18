"use client";

import { useEffect, useState, useCallback } from "react";

let cachedValidatedSet: Set<string> | null = null;
let inFlight: Promise<Set<string>> | null = null;

async function fetchValidatedSet(): Promise<Set<string>> {
  if (cachedValidatedSet) return cachedValidatedSet;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await fetch('/api/validation/cert-nos');
    const json = await res.json();
    const normalize = (s: string) => (s || '').toString().trim().toUpperCase();
    const set = new Set<string>((json?.certNos || []).map((s: string) => normalize(s)));
    cachedValidatedSet = set;
    inFlight = null;
    return set;
  })();
  return inFlight;
}

export function useValidatedCertNos(autoLoad: boolean = true) {
  const [setState, setSetState] = useState<Set<string> | null>(cachedValidatedSet);
  const [loading, setLoading] = useState<boolean>(!cachedValidatedSet && autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Force refetch
      cachedValidatedSet = null;
      const set = await fetchValidatedSet();
      setSetState(new Set(set));
    } catch (e) {
      setError('Failed to load validated certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!autoLoad || setState) return;
    (async () => {
      try {
        setLoading(true);
        const set = await fetchValidatedSet();
        if (!cancelled) setSetState(new Set(set));
      } catch (e) {
        if (!cancelled) setError('Failed to load validated certificates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [autoLoad, setState]);

  return { set: setState, loading, error, refresh };
}


