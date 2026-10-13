import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Child } from '../lib/useSettings';
import type { Theme } from '../theme';

type Props = {
  theme: Theme;
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

/** Výběr uloženého dítěte; klepnutím na vybrané dítě se otevře jeho úprava. */
export function ChildSwitcher({
  theme,
  children,
  selectedId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: Props) {
  // null = zavřeno, 'new' = nové dítě, jinak upravované dítě
  const [editing, setEditing] = useState<Child | 'new' | null>(null);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {children.map((child) => {
          const active = child.id === selectedId;
          return (
            <Pressable
              key={child.id}
              onPress={() => (active ? setEditing(child) : onSelect(child.id))}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityHint={active ? 'Otevře úpravu jména' : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? theme.onPrimary : theme.text }]}>
                {child.name}
              </Text>
              {active && (
                <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.onPrimary} />
              )}
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setEditing('new')}
          accessibilityRole="button"
          style={[styles.chip, styles.add, { borderColor: theme.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.primary} />
          <Text style={[styles.chipText, { color: theme.primary }]}>
            {children.length === 0 ? 'Uložit dítě' : 'Přidat dítě'}
          </Text>
        </Pressable>
      </ScrollView>

      <ChildEditor
        theme={theme}
        editing={editing}
        isFirst={children.length === 0}
        onClose={() => setEditing(null)}
        onSave={(name) => {
          if (editing === 'new') onAdd(name);
          else if (editing) onRename(editing.id, name);
          setEditing(null);
        }}
        onRemove={() => {
          if (editing && editing !== 'new') onRemove(editing.id);
          setEditing(null);
        }}
      />
    </>
  );
}

function ChildEditor({
  theme,
  editing,
  isFirst,
  onClose,
  onSave,
  onRemove,
}: {
  theme: Theme;
  editing: Child | 'new' | null;
  isFirst: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const existing = editing !== null && editing !== 'new' ? editing : null;
  const trimmed = name.trim();

  useEffect(() => {
    setName(existing?.name ?? '');
    setConfirmRemove(false);
  }, [editing]);

  return (
    <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Zavřít"
        />
        <View style={[styles.dialog, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {existing ? 'Upravit dítě' : 'Uložit dítě'}
          </Text>
          <Text style={[styles.help, { color: theme.textMuted }]}>
            {existing
              ? 'Hmotnost se ukládá sama, jakmile ji na hlavní obrazovce změníte.'
              : isFirst
                ? 'K dítěti se uloží už zadaná hmotnost a dosavadní deníček. Každé dítě má deníček zvlášť.'
                : 'Každé dítě má vlastní hmotnost a vlastní deníček dávek.'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Jméno dítěte"
            placeholderTextColor={theme.textMuted}
            autoFocus
            maxLength={24}
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onSave(trimmed)}
            accessibilityLabel="Jméno dítěte"
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
            ]}
          />

          <Pressable
            onPress={() => onSave(trimmed)}
            disabled={!trimmed}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: theme.primary, opacity: !trimmed ? 0.4 : pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.saveText, { color: theme.onPrimary }]}>Uložit</Text>
          </Pressable>

          {existing && (
            <Pressable
              onPress={() => (confirmRemove ? onRemove() : setConfirmRemove(true))}
              accessibilityRole="button"
              style={styles.remove}
            >
              <Text style={[styles.removeText, { color: theme.warning }]}>
                {confirmRemove
                  ? `Opravdu smazat ${existing.name} i s deníčkem?`
                  : 'Smazat dítě a jeho deníček'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  add: {
    borderStyle: 'dashed',
    paddingLeft: 12,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  help: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  save: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  remove: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
