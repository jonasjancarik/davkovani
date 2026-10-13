import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Ingredient, Product } from '../data/medicines';
import { formatNumber, type Dose } from '../lib/dosage';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  product: Product;
  ingredient: Ingredient;
  /** Chybí, dokud není zadaná hmotnost. */
  dose?: Dose;
  onPress: () => void;
};

export function strengthText(product: Product): string {
  return product.form === 'syrup'
    ? `${product.mgPerMl} mg v 1 ml`
    : `${product.mgPerPiece} mg v 1 ks`;
}

export function ProductRow({ theme, product, ingredient, dose, onPress }: Props) {
  const tint = theme.ingredient[ingredient.id];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: tint.soft }]}>
        <MaterialCommunityIcons
          name={product.form === 'syrup' ? 'water' : 'pill'}
          size={22}
          color={tint.color}
        />
      </View>

      <View style={styles.text}>
        <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {ingredient.name} · {strengthText(product)}
        </Text>
      </View>

      {dose?.status === 'ok' && (
        <View style={styles.dose}>
          <Text style={[styles.doseValue, { color: tint.color }]}>{formatNumber(dose.amount)}</Text>
          <Text style={[styles.doseUnit, { color: tint.color }]}>{dose.unit}</Text>
        </View>
      )}
      {dose?.status === 'tooLow' && (
        <Text style={[styles.tooLow, { color: theme.warning, backgroundColor: theme.warningSoft }]}>
          Nevhodné
        </Text>
      )}

      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  dose: {
    alignItems: 'flex-end',
  },
  doseValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  doseUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  tooLow: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
