import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SOURCE_NAME, type Brand, type Ingredient, type Product } from '../data/medicines';
import { formatNumber, intervalText, type Dose } from '../lib/dosage';
import { CONTENT_MAX_WIDTH, type Theme } from '../theme';
import { PieceVisual } from './PieceVisual';
import { strengthText } from './ProductRow';

export type Selection = {
  product: Product;
  brand: Brand;
  ingredient: Ingredient;
  dose: Dose;
  weight: number;
};

type Props = {
  theme: Theme;
  selection: Selection | null;
  onClose: () => void;
};

export function DoseDetail({ theme, selection, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  // Na telefonu vyjíždí zespodu, na širší obrazovce se zobrazí uprostřed.
  const centered = width >= 720;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => setCopied(false), [selection]);

  return (
    <Modal
      visible={selection !== null}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: theme.backdrop },
          centered && styles.backdropCentered,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Zavřít"
          accessibilityRole="button"
        />
        {selection && (
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.surface, marginTop: insets.top + 24 },
              centered && styles.sheetCentered,
            ]}
          >
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
              bounces={false}
            >
              <Content
                theme={theme}
                selection={selection}
                copied={copied}
                onCopy={async () => {
                  await Clipboard.setStringAsync(summaryText(selection));
                  setCopied(true);
                }}
                onClose={onClose}
              />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

function summaryText({ product, brand, ingredient, dose, weight }: Selection): string {
  if (dose.status !== 'ok') return '';
  const amount = `${formatNumber(dose.amount)} ${dose.unit}`;
  return (
    `Dávkování pro ${formatNumber(weight)} kg: ${brand.name} ${product.name} – ${amount}. ` +
    `${intervalText(ingredient)}. Zdroj: ${SOURCE_NAME}`
  );
}

function Content({
  theme,
  selection,
  copied,
  onCopy,
  onClose,
}: {
  theme: Theme;
  selection: Selection;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const { product, brand, ingredient, dose, weight } = selection;
  const tint = theme.ingredient[ingredient.id];
  const idealMg = `${formatNumber(Math.round(dose.idealMg * 10) / 10)}\u00a0mg`;

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {brand.name} {product.name}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {strengthText(product)} · dítě {formatNumber(weight)} kg
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Zavřít"
          style={({ pressed }) => [
            styles.close,
            { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.text} />
        </Pressable>
      </View>

      {dose.status === 'ok' ? (
        <View style={[styles.doseCard, { backgroundColor: tint.soft }]}>
          <Text style={[styles.caption, { color: tint.color }]}>Jednotlivá dávka</Text>
          <View style={styles.doseLine}>
            <Text style={[styles.doseValue, { color: tint.color }]}>
              {formatNumber(dose.amount)}
            </Text>
            <Text style={[styles.doseUnit, { color: tint.color }]}>{dose.unit}</Text>
          </View>
          {dose.pieces > 0 && (
            <PieceVisual
              pieces={dose.pieces}
              form={product.form}
              color={tint.color}
              emptyColor={theme.surface}
            />
          )}
          <Text style={[styles.instruction, { color: theme.text }]}>{dose.instruction}</Text>
        </View>
      ) : (
        <View style={[styles.doseCard, { backgroundColor: theme.warningSoft }]}>
          <View style={styles.warningTitle}>
            <MaterialCommunityIcons name="alert-outline" size={22} color={theme.warning} />
            <Text style={[styles.warningHeading, { color: theme.warning }]}>
              Tahle forma se pro {formatNumber(weight)} kg nehodí
            </Text>
          </View>
          <Text style={[styles.instruction, { color: theme.text }]}>{dose.instruction}</Text>
        </View>
      )}

      <View style={[styles.facts, { borderColor: theme.border }]}>
        <Fact
          theme={theme}
          icon="flask-outline"
          label={`Účinná látka: ${ingredient.name}`}
          value={
            dose.status === 'ok'
              ? `${formatNumber(dose.actualMg)} mg v této dávce`
              : `${ingredient.mgPerKg} mg na kilogram`
          }
          note={
            dose.status === 'ok'
              ? `Výpočet podle hmotnosti vychází na ${idealMg}, dávka pokrývá ${dose.coverage}\u00a0%.`
              : `Výpočet podle hmotnosti vychází na ${idealMg}.`
          }
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Fact
          theme={theme}
          icon="clock-outline"
          label="Jak často"
          value={intervalText(ingredient)}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Fact
          theme={theme}
          icon="swap-horizontal"
          label="Když teplota neklesá"
          value={`Střídejte s ${ingredient.alternateWith}`}
          note={'Lék s jinou účinnou látkou můžete podat po 4\u00a0hodinách.'}
        />
      </View>

      {dose.status === 'ok' && (
        <Pressable
          onPress={onCopy}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.copy,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name={copied ? 'check' : 'content-copy'}
            size={18}
            color={theme.onPrimary}
          />
          <Text style={[styles.copyText, { color: theme.onPrimary }]} aria-live="polite">
            {copied ? 'Zkopírováno' : 'Zkopírovat dávkování'}
          </Text>
        </Pressable>
      )}
    </>
  );
}

function Fact({
  theme,
  icon,
  label,
  value,
  note,
}: {
  theme: Theme;
  icon: 'flask-outline' | 'clock-outline' | 'swap-horizontal';
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <View style={styles.fact}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.textMuted} style={styles.factIcon} />
      <View style={styles.factText}>
        <Text style={[styles.factLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
        {note && <Text style={[styles.factNote, { color: theme.textMuted }]}>{note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropCentered: {
    justifyContent: 'center',
    padding: 24,
  },
  sheetCentered: {
    marginTop: 0,
    borderRadius: 28,
  },
  sheet: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    flexShrink: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseCard: {
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  caption: {
    fontSize: 13,
    fontWeight: '700',
  },
  doseLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  doseValue: {
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  doseUnit: {
    fontSize: 26,
    fontWeight: '700',
  },
  instruction: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  warningTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningHeading: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  facts: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  fact: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  factIcon: {
    marginTop: 1,
  },
  factText: {
    flex: 1,
    gap: 2,
  },
  factLabel: {
    fontSize: 13,
  },
  factValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  factNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 18,
  },
  copyText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
