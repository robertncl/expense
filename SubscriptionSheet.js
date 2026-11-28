import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { normalizeDigits, parseAmount } from './i18n';
import { CategoryPicker, PrimaryButton, SecondaryButton, SheetHeader } from './controls';
import { cycles } from './subscriptions';
import { addDays, isISODate } from './dates';

// Past charges are added from the first charge date on, so keep it within ten years:
// a mistyped year would otherwise add thousands of expenses at once.
const MAX_BACKFILL_DAYS = 3653;

export default function SubscriptionSheet({
  visible,
  subscription,
  today,
  onSave,
  onEnd,
  onDelete,
  onClose,
  ui,
}) {
  const { s, fmt, styles, t } = ui;
  const editing = !!subscription;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [startDate, setStartDate] = useState(today);
  const [category, setCategory] = useState('Bills');

  // Reset the form each time the sheet opens, not when `today` changes while it is open.
  useEffect(() => {
    if (!visible) return;
    setName(subscription?.name ?? '');
    setAmount(subscription ? fmt.amountInput(subscription.amount) : '');
    setCycle(subscription?.cycle ?? 'monthly');
    setStartDate(subscription?.startDate ?? today);
    setCategory(subscription?.category ?? 'Bills');
  }, [visible, subscription]);

  const parsedAmount = parseAmount(amount, fmt.decimal);
  const isoStart = normalizeDigits(startDate);
  const canSave =
    name.trim() &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    isISODate(isoStart) &&
    isoStart >= addDays(today, -MAX_BACKFILL_DAYS);

  const save = () => {
    if (!canSave) return;
    onSave({
      ...(subscription ?? { id: `sub-${Date.now()}`, postedThrough: null }),
      name: name.trim(),
      amount: parsedAmount,
      cycle,
      startDate: isoStart,
      category,
    });
  };

  const confirmDelete = () =>
    Alert.alert(s.deleteSubscription, s.deleteChargesConfirm, [
      { text: s.cancel, style: 'cancel' },
      { text: s.delete, style: 'destructive', onPress: () => onDelete(subscription.id) },
    ]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={s.cancel} />
        <View style={[styles.sheet, styles.sheetTall]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <SheetHeader title={editing ? s.editSubscription : s.newSubscription} onClose={onClose} ui={ui} />

            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>{fmt.currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={t.ink3}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus={!editing}
              />
            </View>

            <Text style={styles.fieldLabel}>{s.name}</Text>
            <TextInput
              style={styles.input}
              placeholder={s.namePlaceholder}
              placeholderTextColor={t.ink3}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>{s.billingCycle}</Text>
            <View style={styles.cycleRow} accessibilityRole="radiogroup">
              {cycles.map(c => {
                const active = cycle === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCycle(c)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={[styles.cycleChip, active && styles.chipActive]}
                  >
                    <Text style={[styles.catTileText, active && styles.catTileTextActive]} numberOfLines={1}>
                      {s.cycles[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>{s.firstCharge}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={t.ink3}
              value={startDate}
              onChangeText={setStartDate}
            />
            <Text style={styles.fieldNote}>{editing ? s.futureChangesNote : s.subscriptionNote}</Text>

            <CategoryPicker value={category} onChange={setCategory} ui={ui} />

            <View style={styles.sheetActions}>
              <PrimaryButton
                label={editing ? s.saveChanges : s.addSubscription}
                onPress={save}
                disabled={!canSave}
                ui={ui}
              />
              {editing ? (
                <>
                  <SecondaryButton label={s.endSubscription} onPress={() => onEnd(subscription.id)} ui={ui} />
                  <View style={styles.sheetSecondary}>
                    <Pressable onPress={confirmDelete} style={styles.textBtn} accessibilityRole="button">
                      <Text style={styles.dangerBtnText}>{s.deleteSubscription}</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
