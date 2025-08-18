"use client";

import { useEffect, useState, useCallback } from "react";

let cachedPhoenixSet: Set<string> | null = null;
let inFlight: Promise<Set<string>> | null = null;

async function fetchPhoenixSet(): Promise<Set<string>> {
  if (cachedPhoenixSet) return cachedPhoenixSet;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await fetch('/api/certificates/current');
    const json = await res.json();
    const normalize = (s: string) => (s || '').toString().trim().toUpperCase();
    const set = new Set<string>((json?.certificates || []).map((c: any) => normalize(c.CertNo)));
    cachedPhoenixSet = set;
    inFlight = null;
    return set;
  })();
  return inFlight;
}

export function usePhoenixLiveSet(autoLoad: boolean = true) {
  const [setState, setSetState] = useState<Set<string> | null>(cachedPhoenixSet);
  const [loading, setLoading] = useState<boolean>(!cachedPhoenixSet && autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Force refetch by clearing cache
      cachedPhoenixSet = null;
      const set = await fetchPhoenixSet();
      setSetState(new Set(set));
    } catch (e) {
      setError('Failed to load live certificates');
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
        const set = await fetchPhoenixSet();
        if (!cancelled) setSetState(new Set(set));
      } catch (e) {
        if (!cancelled) setError('Failed to load live certificates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [autoLoad, setState]);

  return { set: setState, loading, error, refresh };
}


