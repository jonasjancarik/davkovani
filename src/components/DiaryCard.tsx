import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ingredients } from '../data/medicines';
import {
  formatClock,
  formatRemaining,
  HOURS_BEFORE_OTHER_INGREDIENT,
  lastDoseTime,
  nextDoseTime,
  type DiaryEntry,
} from '../lib/diary';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  entries: DiaryEntry[];
  now: number;
  onRemove: (id: string) => void;
  onClear: () => void;
};

const COLLAPSED_COUNT = 3;

export function DiaryCard({ theme, entries, now, onRemove, onClear }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT);
  const hiddenCount = entries.length - visible.length;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.heading, { color: theme.text }]} accessibilityRole="header">
        Kdy lze podat další dávku
      </Text>

      {Object.values(ingredients).map((ingredient) => {
        const tint = theme.ingredient[ingredient.id];
        const next = nextDoseTime(entries, ingredient);
        const last = lastDoseTime(entries, ingredient.id);
        const allowed = next <= now;
        return (
          <View key={ingredient.id} style={[styles.status, { backgroundColor: tint.soft }]}>
            <View style={styles.statusText}>
              <Text style={[styles.statusName, { color: tint.color }]}>{ingredient.name}</Text>
              <Text style={[styles.statusLast, { color: theme.textMuted }]}>
                {last === null ? 'Zatím nepodáno' : `Naposledy ${formatClock(last, now, true)}`}
              </Text>
            </View>
            <View style={styles.statusWhen}>
              <Text style={[styles.statusTime, { color: theme.text }]}>
                {allowed ? 'Lze podat teď' : formatClock(next, now)}
              </Text>
              {!allowed && (
                <Text style={[styles.statusLast, { color: theme.textMuted }]}>
                  {formatRemaining(next - now)}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      <Text style={[styles.rules, { color: theme.textMuted }]}>
        Ibuprofen nejvýše {ingredients.ibu.maxPerDay}× denně po {ingredients.ibu.hoursBetweenDoses}{' '}
        hodinách, paracetamol {ingredients.par.maxPerDay}× denně po{' '}
        {ingredients.par.hoursBetweenDoses} hodinách. Lék s druhou látkou nejdříve{' '}
        {HOURS_BEFORE_OTHER_INGREDIENT} hodiny po předchozí dávce.
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <Text style={[styles.subheading, { color: theme.textMuted }]}>Podané dávky</Text>
      {visible.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <View
            style={[styles.dot, { backgroundColor: theme.ingredient[entry.ingredient].color }]}
          />
          <View style={styles.entryText}>
            <Text style={[styles.entryTitle, { color: theme.text }]}>
              {formatClock(entry.time, now)} · {entry.amount}
            </Text>
            <Text style={[styles.entryMeta, { color: theme.textMuted }]}>{entry.label}</Text>
          </View>
          {confirmRemove === entry.id ? (
            <Pressable
              onPress={() => {
                setConfirmRemove(null);
                onRemove(entry.id);
              }}
              accessibilityRole="button"
              style={[styles.confirm, { backgroundColor: theme.warningSoft }]}
            >
              <Text style={[styles.confirmText, { color: theme.warning }]}>Smazat?</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setConfirmRemove(entry.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Smazat záznam ${formatClock(entry.time, now)}`}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      ))}

      <View style={styles.actions}>
        {entries.length > COLLAPSED_COUNT && (
          <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.action, { color: theme.primary }]}>
              {expanded ? 'Zobrazit méně' : `Zobrazit starší (${hiddenCount})`}
            </Text>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Pressable
          onPress={() => {
            if (confirmClear) onClear();
            setConfirmClear(!confirmClear);
          }}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.action, { color: confirmClear ? theme.warning : theme.textMuted }]}>
            {confirmClear ? 'Opravdu vymazat všechny záznamy?' : 'Vymazat deníček'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusText: {
    flex: 1,
    gap: 1,
  },
  statusName: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusLast: {
    fontSize: 13,
  },
  statusWhen: {
    alignItems: 'flex-end',
    gap: 1,
  },
  statusTime: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rules: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '700',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  entryText: {
    flex: 1,
    gap: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  entryMeta: {
    fontSize: 13,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
  },
});
