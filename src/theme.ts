import { useColorScheme } from 'react-native';

import type { IngredientId } from './data/medicines';

export type Theme = {
  dark: boolean;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  warning: string;
  warningSoft: string;
  backdrop: string;
  ingredient: Record<IngredientId, { color: string; soft: string }>;
};

const light: Theme = {
  dark: false,
  background: '#F3F6F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F4',
  border: '#DFE6E9',
  text: '#0E1D22',
  textMuted: '#586970',
  primary: '#1F7488',
  primarySoft: '#E1F0F4',
  onPrimary: '#FFFFFF',
  warning: '#9A5B00',
  warningSoft: '#FFF3DC',
  backdrop: 'rgba(9, 20, 24, 0.5)',
  ingredient: {
    ibu: { color: '#BE1F6E', soft: '#FCE8F2' },
    par: { color: '#1D57D8', soft: '#E6EEFF' },
  },
};

const dark: Theme = {
  dark: true,
  background: '#0A1316',
  surface: '#121E22',
  surfaceMuted: '#1A292E',
  border: '#24363C',
  text: '#EAF2F4',
  textMuted: '#93A6AD',
  primary: '#56B6CB',
  primarySoft: '#143039',
  onPrimary: '#06181D',
  warning: '#F5B95A',
  warningSoft: '#33260E',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  ingredient: {
    ibu: { color: '#F47CB6', soft: '#3A1629' },
    par: { color: '#82ABFF', soft: '#15254A' },
  },
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const CONTENT_MAX_WIDTH = 560;
