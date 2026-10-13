import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { DosingMode } from './dosage';

export type Child = {
  id: string;
  name: string;
  /** Hmotnost tak, jak je zapsaná v poli ("12,5"). */
  weight: string;
};

type Settings = {
  children: Child[];
  selectedId: string | null;
  mode: DosingMode;
};

const STORAGE_KEY = 'davkovani.settings.v1';
const defaults: Settings = { children: [], selectedId: null, mode: 'leaflet' };

/** Uložené děti, vybrané dítě a režim dávkování; vše zůstává v zařízení. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded] = useState(false);
  /** Hmotnost zadaná bez uloženého dítěte se neukládá. */
  const [looseWeight, setLooseWeight] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const selected = settings.children.find((c) => c.id === settings.selectedId) ?? null;

  const setWeight = useCallback(
    (weight: string) => {
      if (!selected) {
        setLooseWeight(weight);
        return;
      }
      setSettings((current) => ({
        ...current,
        children: current.children.map((c) => (c.id === selected.id ? { ...c, weight } : c)),
      }));
    },
    [selected],
  );

  const setMode = useCallback((mode: DosingMode) => {
    setSettings((current) => ({ ...current, mode }));
  }, []);

  const select = useCallback((id: string) => {
    setSettings((current) => ({ ...current, selectedId: id }));
  }, []);

  /** Uloží nové dítě a vybere ho; první dítě převezme už zadanou hmotnost. */
  const addChild = useCallback(
    (name: string): Child => {
      const child: Child = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        weight: settings.children.length === 0 ? looseWeight : '',
      };
      setSettings((current) => ({
        ...current,
        children: [...current.children, child],
        selectedId: child.id,
      }));
      return child;
    },
    [settings.children.length, looseWeight],
  );

  const renameChild = useCallback((id: string, name: string) => {
    setSettings((current) => ({
      ...current,
      children: current.children.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  }, []);

  const removeChild = useCallback((id: string) => {
    setSettings((current) => {
      const children = current.children.filter((c) => c.id !== id);
      return {
        ...current,
        children,
        selectedId: current.selectedId === id ? (children[0]?.id ?? null) : current.selectedId,
      };
    });
  }, []);

  return {
    children: settings.children,
    selected,
    mode: settings.mode,
    weight: selected ? selected.weight : looseWeight,
    setWeight,
    setMode,
    select,
    addChild,
    renameChild,
    removeChild,
  };
}
