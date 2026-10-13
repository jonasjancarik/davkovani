import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RefObject } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatNumber, parseWeight, sanitizeWeightText } from '../lib/dosage';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<TextInput | null>;
};

const STEP = 0.5;

// Prohlížeč jinak kolem pole kreslí vlastní rámeček; kurzor v poli stačí.
const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

export function WeightInput({ theme, value, onChange, inputRef }: Props) {
  const weight = parseWeight(value);

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.round((weight + delta) * 100) / 100);
    onChange(next === 0 ? '' : formatNumber(next));
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textMuted }]} nativeID="weight-label">
        Hmotnost dítěte
      </Text>
      <View style={styles.row}>
        <StepButton
          theme={theme}
          icon="minus"
          label="Ubrat půl kila"
          disabled={weight <= 0}
          onPress={() => adjust(-STEP)}
        />
        <Pressable style={styles.field} onPress={() => inputRef.current?.focus()}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={(text) => onChange(sanitizeWeightText(text))}
            placeholder="0"
            placeholderTextColor={theme.border}
            keyboardType="decimal-pad"
            inputMode="decimal"
            returnKeyType="done"
            maxLength={6}
            selectTextOnFocus
            accessibilityLabel="Hmotnost dítěte v kilogramech"
            accessibilityLabelledBy="weight-label"
            style={[
              styles.input,
              webNoOutline,
              { color: theme.primary, width: Math.max(value.length, 1) * 36 },
            ]}
          />
          <Text style={[styles.unit, { color: theme.textMuted }]}>kg</Text>
        </Pressable>
        <StepButton theme={theme} icon="plus" label="Přidat půl kila" onPress={() => adjust(STEP)} />
      </View>
    </View>
  );
}

function StepButton({
  theme,
  icon,
  label,
  disabled,
  onPress,
}: {
  theme: Theme;
  icon: 'minus' | 'plus';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: theme.primarySoft, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={26} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  input: {
    padding: 0,
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginBottom: 11,
    fontSize: 20,
    fontWeight: '700',
  },
  step: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
