import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const categories = [
  { name: 'Food', icon: '🍔', color: '#F97316' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Bills', icon: '🧾', color: '#10B981' },
  { name: 'Other', icon: '✨', color: '#8B5CF6' },
];
const categoryByName = Object.fromEntries(categories.map(c => [c.name, c]));

const themes = {
  light: {
    bg: '#F4F5F9',
    card: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    chip: '#EEF0F5',
    primary: '#4F46E5',
    hero: '#1E1B4B',
    danger: '#EF4444',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    bg: '#0B0D14',
    card: '#161A24',
    text: '#F1F5F9',
    muted: '#94A3B8',
    border: '#262B38',
    chip: '#1F2430',
    primary: '#818CF8',
    hero: '#312E81',
    danger: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

const todayISO = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatMoney = n => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function App() {
  const scheme = useColorScheme();
  const t = themes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(t), [t]);
  const { width } = useWindowDimensions();

  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0].name);
  const [date, setDate] = useState(todayISO());
  const [filterCat, setFilterCat] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);

  const resetForm = () => {
    setDesc(''); setAmount(''); setCategory(categories[0].name); setDate(todayISO()); setEditId(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); resetForm(); };

  const parsedAmount = parseFloat(amount);
  const canSave = desc.trim() && parsedAmount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const addOrEditExpense = () => {
    if (!canSave) return;
    const entry = { desc: desc.trim(), amount: parsedAmount, category, date };
    if (editId !== null) {
      setExpenses(expenses.map(e => (e.id === editId ? { ...e, ...entry } : e)));
    } else {
      setExpenses([...expenses, { id: Date.now().toString(), ...entry }]);
    }
    closeModal();
  };

  const deleteExpense = () => {
    setExpenses(expenses.filter(e => e.id !== editId));
    closeModal();
  };

  const startEdit = exp => {
    setDesc(exp.desc);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDate(exp.date);
    setEditId(exp.id);
    setModalVisible(true);
  };

  const filteredExpenses = expenses
    .filter(exp => (filterCat === 'All' || exp.category === filterCat) && (!filterDate || exp.date === filterDate))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = categories
    .map(cat => ({
      ...cat,
      amount: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Prepare data for trend chart
  const dateTotals = {};
  expenses.forEach(e => {
    dateTotals[e.date] = (dateTotals[e.date] || 0) + e.amount;
  });
  const trendDates = Object.keys(dateTotals).sort().slice(-7); // last 7 days with spending
  const trendData = trendDates.map(d => dateTotals[d]);

  const contentWidth = Math.min(width, 640) - 40;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={styles.title}>Expenses</Text>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total spent</Text>
          <Text style={styles.heroAmount}>{formatMoney(totalSpent)}</Text>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatValue}>{expenses.length}</Text>
              <Text style={styles.heroStatLabel}>Transactions</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroStatValue}>
                {formatMoney(expenses.length ? totalSpent / expenses.length : 0)}
              </Text>
              <Text style={styles.heroStatLabel}>Average</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by category</Text>
          {categoryTotals.length > 0 ? (
            <>
              <View style={styles.stackedBar}>
                {categoryTotals.map(c => (
                  <View key={c.name} style={{ flex: c.amount, backgroundColor: c.color }} />
                ))}
              </View>
              {categoryTotals.map(c => (
                <View key={c.name} style={styles.breakdownRow}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.breakdownName}>{c.name}</Text>
                  <Text style={styles.breakdownPct}>{Math.round((c.amount / totalSpent) * 100)}%</Text>
                  <Text style={styles.breakdownAmount}>{formatMoney(c.amount)}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.emptyText}>Add an expense to see your breakdown.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trend</Text>
          {trendDates.length > 0 ? (
            <LineChart
              data={{ labels: trendDates.map(d => d.slice(5)), datasets: [{ data: trendData }] }}
              width={contentWidth - 16}
              height={180}
              yAxisLabel="$"
              withInnerLines={false}
              withOuterLines={false}
              chartConfig={{
                backgroundGradientFrom: t.card,
                backgroundGradientTo: t.card,
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                fillShadowGradientFrom: t.primary,
                fillShadowGradientFromOpacity: 0.25,
                fillShadowGradientTo: t.primary,
                fillShadowGradientToOpacity: 0,
                decimalPlaces: 0,
                color: () => t.primary,
                labelColor: () => t.muted,
                propsForDots: { r: '4', strokeWidth: '2', stroke: t.card },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.emptyText}>No trend data yet.</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <View style={styles.dateFilter}>
            <TextInput
              style={styles.dateFilterInput}
              placeholder="Filter date"
              placeholderTextColor={t.muted}
              value={filterDate}
              onChangeText={setFilterDate}
            />
            {filterDate ? (
              <Pressable onPress={() => setFilterDate('')} hitSlop={8}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {['All', ...categories.map(c => c.name)].map(name => {
            const active = filterCat === name;
            return (
              <Pressable
                key={name}
                onPress={() => setFilterCat(name)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {categoryByName[name] ? `${categoryByName[name].icon}  ` : ''}{name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🪙</Text>
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptyText}>Tap + to add your first one.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filteredExpenses.map((item, i) => {
              const cat = categoryByName[item.category];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => startEdit(item)}
                  style={({ pressed }) => [
                    styles.expenseItem,
                    i > 0 && styles.expenseItemBorder,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={[styles.iconBubble, { backgroundColor: cat.color + '22' }]}>
                    <Text style={styles.iconText}>{cat.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>{item.desc}</Text>
                    <Text style={styles.expenseMeta}>{item.category} · {item.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(item.amount)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityLabel="Add expense"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{editId !== null ? 'Edit expense' : 'New expense'}</Text>

            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={t.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus={editId === null}
              />
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lunch with friends"
              placeholderTextColor={t.muted}
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={t.muted}
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catGrid}>
              {categories.map(cat => {
                const active = category === cat.name;
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => setCategory(cat.name)}
                    style={[
                      styles.catTile,
                      active && { borderColor: cat.color, backgroundColor: cat.color + '1A' },
                    ]}
                  >
                    <Text style={styles.catTileIcon}>{cat.icon}</Text>
                    <Text style={[styles.catTileText, active && { color: cat.color }]}>{cat.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={addOrEditExpense}
              disabled={!canSave}
              style={[styles.primaryBtn, !canSave && { opacity: 0.4 }]}
            >
              <Text style={styles.primaryBtnText}>{editId !== null ? 'Save changes' : 'Add expense'}</Text>
            </Pressable>
            {editId !== null ? (
              <Pressable onPress={deleteExpense} style={styles.ghostBtn}>
                <Text style={[styles.ghostBtnText, { color: t.danger }]}>Delete expense</Text>
              </Pressable>
            ) : (
              <Pressable onPress={closeModal} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

const makeStyles = t => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg },
  container: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 120, width: '100%', maxWidth: 640, alignSelf: 'center' },
  eyebrow: { color: t.muted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginTop: 2, marginBottom: 20 },

  hero: {
    backgroundColor: t.hero,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: t.hero,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  heroAmount: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 20 },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroStatValue: { color: '#fff', fontSize: 17, fontWeight: '700' },
  heroStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  card: { backgroundColor: t.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: t.border },
  cardTitle: { color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  stackedBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14, gap: 2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  breakdownName: { color: t.text, fontSize: 15, flex: 1 },
  breakdownPct: { color: t.muted, fontSize: 13, marginRight: 12 },
  breakdownAmount: { color: t.text, fontSize: 15, fontWeight: '600', minWidth: 80, textAlign: 'right' },
  chart: { marginLeft: -16, marginBottom: -8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  sectionTitle: { color: t.text, fontSize: 20, fontWeight: '700' },
  dateFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.chip, borderRadius: 12, paddingHorizontal: 12 },
  dateFilterInput: { color: t.text, paddingVertical: 8, width: 104, fontSize: 14 },
  clearIcon: { color: t.muted, fontSize: 13, paddingLeft: 6 },

  chipRow: { gap: 8, paddingBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.chip },
  chipActive: { backgroundColor: t.text },
  chipText: { color: t.text, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: t.bg },

  listCard: { backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.border, overflow: 'hidden' },
  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  expenseItemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
  iconBubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  expenseDesc: { color: t.text, fontSize: 16, fontWeight: '600' },
  expenseMeta: { color: t.muted, fontSize: 13, marginTop: 2 },
  expenseAmount: { color: t.text, fontSize: 16, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { color: t.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: t.muted, fontSize: 14, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '400', marginTop: -2 },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.overlay },
  sheet: {
    backgroundColor: t.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.border, marginBottom: 16 },
  modalTitle: { color: t.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  amountCurrency: { color: t.muted, fontSize: 32, fontWeight: '600', marginRight: 4 },
  amountInput: { color: t.text, fontSize: 44, fontWeight: '800', minWidth: 120, textAlign: 'center', padding: 0 },
  fieldLabel: { color: t.muted, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: {
    color: t.text,
    backgroundColor: t.chip,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: t.border,
  },
  catTileIcon: { fontSize: 16 },
  catTileText: { color: t.text, fontSize: 14, fontWeight: '600' },
  primaryBtn: { backgroundColor: t.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { color: t.muted, fontSize: 15, fontWeight: '600' },
});
