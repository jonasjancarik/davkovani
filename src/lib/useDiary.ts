import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { pruneOld, type DiaryEntry } from './diary';

const STORAGE_KEY = 'davkovani.diary.v1';

/** Deníček podaných dávek uložený v zařízení. */
export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const stored: DiaryEntry[] = raw ? JSON.parse(raw) : [];
        setEntries(pruneOld(stored, Date.now()));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
  }, [entries, loaded]);

  const add = useCallback((entry: Omit<DiaryEntry, 'id'>) => {
    const id = `${entry.time}-${Math.random().toString(36).slice(2, 8)}`;
    setEntries((current) => [{ ...entry, id }, ...current].sort((a, b) => b.time - a.time));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((current) => current.filter((e) => e.id !== id));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, remove, clear };
}

/** Aktuální čas, který se sám obnovuje, aby odpočty v deníčku nezastaraly. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
