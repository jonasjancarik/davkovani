import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiaryCard } from './src/components/DiaryCard';
import { DoseDetail, type Selection } from './src/components/DoseDetail';
import { ProductRow } from './src/components/ProductRow';
import { WeightInput } from './src/components/WeightInput';
import {
  brands,
  ingredients,
  products,
  SOURCE_NAME,
  SOURCE_URL,
  type IngredientId,
} from './src/data/medicines';
import { formatClock, nextDoseTime } from './src/lib/diary';
import { calculateDose, formatNumber, parseWeight } from './src/lib/dosage';
import { useDiary, useNow } from './src/lib/useDiary';
import { CONTENT_MAX_WIDTH, useTheme, type Theme } from './src/theme';

type Filter = 'all' | IngredientId;

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Vše' },
  { id: 'ibu', label: ingredients.ibu.name },
  { id: 'par', label: ingredients.par.name },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <Calculator />
    </SafeAreaProvider>
  );
}

function Calculator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const weightRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const diary = useDiary();
  const now = useNow();
  const [weightText, setWeightText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selection, setSelection] = useState<Selection | null>(null);

  const weight = parseWeight(weightText);
  const allowedFrom = {
    ibu: nextDoseTime(diary.entries, ingredients.ibu),
    par: nextDoseTime(diary.entries, ingredients.par),
  };

  const logDose = (time: number) => {
    if (!selection || selection.dose.status !== 'ok') return;
    const { product, brand, ingredient, dose } = selection;
    diary.add({
      time,
      ingredient: ingredient.id,
      label: `${brand.name} ${product.name}`,
      amount: `${formatNumber(dose.amount)} ${dose.unit}`,
      mg: dose.actualMg,
      weight: selection.weight,
    });
    setSelection(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.lang = 'cs';
  }, []);

  // Po zavření klávesnice tlačítkem zpět by pole jinak zůstalo označené.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidHide', () => weightRef.current?.blur());
    return () => subscription.remove();
  }, []);

  const sections = useMemo(
    () =>
      brands
        .map((brand) => ({
          brand,
          items: products
            .filter((p) => p.brand === brand.id && (filter === 'all' || p.ingredient === filter))
            .map((product) => {
              const ingredient = ingredients[product.ingredient];
              const dose = weight > 0 ? calculateDose(weight, product, ingredient) : undefined;
              return { product, ingredient, dose };
            }),
        }))
        .filter((section) => section.items.length > 0),
    [weight, filter],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.column}>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            Dávkování léků
          </Text>
          <Text style={[styles.lead, { color: theme.textMuted }]}>
            Kolik léku na horečku nebo bolest podat dítěti podle jeho hmotnosti.
          </Text>
        </View>

        <View style={[styles.sticky, { backgroundColor: theme.background }]}>
          <View style={styles.column}>
            <WeightInput
              theme={theme}
              value={weightText}
              onChange={setWeightText}
              inputRef={weightRef}
            />
          </View>
        </View>

        <View style={styles.column}>
          {diary.entries.length > 0 && (
            <View style={styles.diary}>
              <DiaryCard
                theme={theme}
                entries={diary.entries}
                now={now}
                onRemove={diary.remove}
                onClear={diary.clear}
              />
            </View>
          )}

          <View style={styles.filters} accessibilityRole="tablist">
            {filters.map(({ id, label }) => {
              const active = filter === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setFilter(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: active ? theme.onPrimary : theme.text }]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {weight <= 0 && (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Zadejte hmotnost a u každého léku se ukáže dávka.
            </Text>
          )}

          {sections.map(({ brand, items }) => (
            <View key={brand.id} style={styles.section}>
              <Text style={[styles.brand, { color: theme.textMuted }]} accessibilityRole="header">
                {brand.name}
              </Text>
              {items.map(({ product, ingredient, dose }) => (
                <ProductRow
                  key={product.id}
                  theme={theme}
                  product={product}
                  ingredient={ingredient}
                  dose={dose}
                  waitUntil={
                    allowedFrom[ingredient.id] > now
                      ? formatClock(allowedFrom[ingredient.id], now, true)
                      : undefined
                  }
                  onPress={() => {
                    if (!dose) {
                      weightRef.current?.focus();
                      return;
                    }
                    weightRef.current?.blur();
                    setSelection({ product, brand, ingredient, dose, weight });
                  }}
                />
              ))}
            </View>
          ))}

          <Footer theme={theme} />
        </View>
      </ScrollView>

      <DoseDetail
        theme={theme}
        selection={selection}
        now={now}
        allowedFrom={selection ? allowedFrom[selection.ingredient.id] : 0}
        onLog={logDose}
        onClose={() => setSelection(null)}
      />
    </View>
  );
}

function Footer({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.footer, { borderColor: theme.border }]}>
      <Text style={[styles.footerText, { color: theme.textMuted }]}>
        Výpočet vychází z kalkulačky ordinace {SOURCE_NAME}. Je orientační a nenahrazuje příbalový
        leták ani radu lékaře.
      </Text>
      <Pressable
        onPress={() => Linking.openURL(SOURCE_URL)}
        accessibilityRole="link"
        hitSlop={8}
        style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[styles.linkText, { color: theme.primary }]}>Otevřít původní kalkulačku</Text>
        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '800',
  },
  lead: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
  },
  sticky: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  diary: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    gap: 8,
  },
  brand: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
