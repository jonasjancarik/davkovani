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
import { formatClock, formatRemaining } from '../lib/diary';
import { formatAmount, formatNumber, type Dose, type DosingMode } from '../lib/dosage';
import { CONTENT_MAX_WIDTH, type Theme } from '../theme';
import { PieceVisual } from './PieceVisual';
import { strengthText } from './ProductRow';

export type Selection = {
  product: Product;
  brand: Brand;
  ingredient: Ingredient;
  dose: Dose;
  weight: number;
  mode: DosingMode;
};

type Props = {
  theme: Theme;
  selection: Selection | null;
  now: number;
  /** Nejbližší čas, kdy lze vybranou látku podle deníčku podat. */
  allowedFrom: number;
  onLog: (time: number) => void;
  onClose: () => void;
};

const logTimes = [
  { minutesAgo: 0, label: 'Teď' },
  { minutesAgo: 15, label: 'Před 15 min' },
  { minutesAgo: 30, label: 'Před 30 min' },
  { minutesAgo: 60, label: 'Před hodinou' },
];

export function DoseDetail({ theme, selection, now, allowedFrom, onLog, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState(0);
  // Na telefonu vyjíždí zespodu, na širší obrazovce se zobrazí uprostřed.
  const centered = width >= 720;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setCopied(false);
    setMinutesAgo(0);
  }, [selection]);

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
                now={now}
                allowedFrom={allowedFrom}
                minutesAgo={minutesAgo}
                onMinutesAgo={setMinutesAgo}
                onLog={() => onLog(Date.now() - minutesAgo * 60000)}
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

function summaryText({ product, brand, dose, weight, mode }: Selection): string {
  if (dose.status !== 'ok') return '';
  const source =
    mode === 'leaflet' ? `příbalový leták (SÚKL ${dose.source})` : `doporučení ${SOURCE_NAME}`;
  return (
    `Dávkování pro ${formatNumber(weight)} kg: ${brand.name} ${product.name} – ` +
    `${formatAmount(dose)} ${dose.unit}. ${dose.schedule.text}. Zdroj: ${source}`
  );
}

function Content({
  theme,
  selection,
  copied,
  now,
  allowedFrom,
  minutesAgo,
  onMinutesAgo,
  onLog,
  onCopy,
  onClose,
}: {
  theme: Theme;
  selection: Selection;
  copied: boolean;
  now: number;
  allowedFrom: number;
  minutesAgo: number;
  onMinutesAgo: (minutes: number) => void;
  onLog: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  const { product, brand, ingredient, dose, weight, mode } = selection;
  const tint = theme.ingredient[ingredient.id];
  const idealMg =
    dose.idealMg === undefined
      ? undefined
      : `${formatNumber(Math.round(dose.idealMg * 10) / 10)}\u00a0mg`;
  const leafletSource = dose.source ? `Podle příbalového letáku (SÚKL, dokument ${dose.source}).` : '';

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
              {formatAmount(dose)}
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
              {mode === 'leaflet'
                ? `Leták pro ${formatNumber(weight)} kg dávku neuvádí`
                : `Tahle forma se pro ${formatNumber(weight)} kg nehodí`}
            </Text>
          </View>
          <Text style={[styles.instruction, { color: theme.text }]}>{dose.instruction}</Text>
        </View>
      )}

      <View style={[styles.facts, { borderColor: theme.border }]}>
        {dose.status === 'ok' && (
          <>
            <Fact
              theme={theme}
              icon="flask-outline"
              label={`Účinná látka: ${ingredient.name}`}
              value={`${formatAmount({ amount: dose.actualMg, amountMax: dose.actualMgMax })} mg v této dávce`}
              note={
                idealMg
                  ? `Výpočet podle hmotnosti vychází na ${idealMg}, dávka pokrývá ${dose.coverage}\u00a0%.`
                  : [
                      leafletSource,
                      dose.age && `Leták tuto dávku uvádí pro věk ${dose.age}.`,
                      dose.note,
                    ]
                      .filter(Boolean)
                      .join(' ')
              }
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Fact
              theme={theme}
              icon="clock-outline"
              label="Jak často"
              value={dose.schedule.text}
              note={dose.schedule.note}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </>
        )}
        {dose.status === 'unsuitable' && (idealMg || leafletSource) && (
          <>
            <Fact
              theme={theme}
              icon="flask-outline"
              label={`Účinná látka: ${ingredient.name}`}
              value={idealMg ? `${ingredient.mgPerKg} mg na kilogram` : 'Dávkování podle letáku'}
              note={idealMg ? `Výpočet podle hmotnosti vychází na ${idealMg}.` : leafletSource}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </>
        )}
        <Fact
          theme={theme}
          icon="swap-horizontal"
          label="Když teplota neklesá"
          value={`Střídejte s ${ingredient.alternateWith}`}
          note={'Lék s jinou účinnou látkou můžete podat po 4\u00a0hodinách.'}
        />
      </View>

      {dose.status === 'ok' && (
        <View style={styles.log}>
          {allowedFrom > now && (
            <View style={[styles.tooSoon, { backgroundColor: theme.warningSoft }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={20} color={theme.warning} />
              <Text style={[styles.tooSoonText, { color: theme.text }]}>
                Podle deníčku lze {ingredient.name.toLowerCase()} podat nejdříve{' '}
                {formatClock(allowedFrom, now, true)} ({formatRemaining(allowedFrom - now)}).
              </Text>
            </View>
          )}

          <Text style={[styles.logLabel, { color: theme.textMuted }]}>Kdy jste dávku podali?</Text>
          <View style={styles.logTimes} accessibilityRole="radiogroup">
            {logTimes.map((option) => {
              const active = option.minutesAgo === minutesAgo;
              return (
                <Pressable
                  key={option.minutesAgo}
                  onPress={() => onMinutesAgo(option.minutesAgo)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.logTime,
                    {
                      backgroundColor: active ? theme.primarySoft : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.logTimeText, { color: active ? theme.primary : theme.text }]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onLog}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="notebook-plus-outline" size={20} color={theme.onPrimary} />
            <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>
              Zapsat dávku do deníčku
            </Text>
          </Pressable>

          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]} aria-live="polite">
              {copied ? 'Zkopírováno' : 'Zkopírovat dávkování'}
            </Text>
          </Pressable>
        </View>
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
  log: {
    gap: 10,
  },
  tooSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
  },
  tooSoonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  logLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  logTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logTime: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  logTimeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    marginTop: 4,
    borderRadius: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
