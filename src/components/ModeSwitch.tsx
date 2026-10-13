import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ingredients } from '../data/medicines';
import type { DosingMode } from '../lib/dosage';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  mode: DosingMode;
  onChange: (mode: DosingMode) => void;
};

const options: { id: DosingMode; label: string }[] = [
  { id: 'leaflet', label: 'Podle letáku' },
  { id: 'pediatric', label: 'Podle pediatrů' },
];

export function ModeSwitch({ theme, mode, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View
        style={[styles.track, { backgroundColor: theme.surfaceMuted }]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Způsob dávkování"
      >
        {options.map((option) => {
          const active = option.id === mode;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.option, active && { backgroundColor: theme.surface }]}
            >
              <Text
                style={[styles.optionText, { color: active ? theme.text : theme.textMuted }]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: theme.textMuted }]}>
        {mode === 'leaflet'
          ? 'Dávky z příbalových letáků jednotlivých léků.'
          : `Vyšší dávky, které doporučují pediatři: ibuprofen ${ingredients.ibu.mgPerKg} mg a paracetamol ${ingredients.par.mgPerKg} mg na kilogram.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  track: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 4,
  },
});
