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
import { categories } from './model';
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
  ui: { s, fmt, styles, t },
}) {
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, styles.sheetTall]}>
          <View style={styles.sheetHandle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editing ? s.editSubscription : s.newSubscription}</Text>

            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>{fmt.currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={t.muted}
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
              placeholderTextColor={t.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>{s.billingCycle}</Text>
            <View style={styles.cycleRow}>
              {cycles.map(c => {
                const active = cycle === c;
                return (
                  <Pressable key={c} onPress={() => setCycle(c)} style={[styles.cycleChip, active && styles.cycleChipActive]}>
                    <Text style={[styles.cycleText, active && styles.cycleTextActive]} numberOfLines={1}>
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
              placeholderTextColor={t.muted}
              value={startDate}
              onChangeText={setStartDate}
            />
            <Text style={styles.fieldNote}>{editing ? s.futureChangesNote : s.subscriptionNote}</Text>

            <Text style={styles.fieldLabel}>{s.category}</Text>
            <View style={styles.catGrid}>
              {categories.map(cat => {
                const active = category === cat.name;
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => setCategory(cat.name)}
                    style={[styles.catTile, active && { borderColor: cat.color, backgroundColor: cat.color + '1A' }]}
                  >
                    <Text style={styles.catTileIcon}>{cat.icon}</Text>
                    <Text style={[styles.catTileText, active && { color: cat.color }]}>{s.categories[cat.name]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={save} disabled={!canSave} style={[styles.primaryBtn, !canSave && { opacity: 0.4 }]}>
              <Text style={styles.primaryBtnText}>{editing ? s.saveChanges : s.addSubscription}</Text>
            </Pressable>
            {editing ? (
              <>
                <Pressable onPress={() => onEnd(subscription.id)} style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>{s.endSubscription}</Text>
                </Pressable>
                <Pressable onPress={confirmDelete} style={styles.ghostBtn}>
                  <Text style={[styles.ghostBtnText, { color: t.danger }]}>{s.deleteSubscription}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={onClose} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>{s.cancel}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
