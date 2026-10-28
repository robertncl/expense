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
import {
  languages,
  languageByCode,
  strings,
  detectLanguage,
  makeFormatters,
  normalizeDigits,
  parseAmount,
  allowsLetterSpacing,
} from './i18n';

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

export default function App() {
  const scheme = useColorScheme();
  const t = themes[scheme === 'dark' ? 'dark' : 'light'];
  const [lang, setLang] = useState(detectLanguage);
  const rtl = !!languageByCode[lang].rtl;
  const s = useMemo(() => ({ ...strings.en, ...strings[lang] }), [lang]);
  const fmt = useMemo(() => makeFormatters(lang), [lang]);
  const styles = useMemo(
    () => makeStyles(t, { rtl, letterSpacing: allowsLetterSpacing(lang) }),
    [t, rtl, lang],
  );
  const { width } = useWindowDimensions();

  const [langPickerVisible, setLangPickerVisible] = useState(false);
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

  const parsedAmount = parseAmount(amount, fmt.decimal);
  const isoDate = normalizeDigits(date);
  const canSave = desc.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(isoDate);

  const addOrEditExpense = () => {
    if (!canSave) return;
    const entry = { desc: desc.trim(), amount: parsedAmount, category, date: isoDate };
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
    setAmount(fmt.amountInput(exp.amount));
    setCategory(exp.category);
    setDate(exp.date);
    setEditId(exp.id);
    setModalVisible(true);
  };

  const isoFilterDate = normalizeDigits(filterDate);
  const filteredExpenses = expenses
    .filter(exp => (filterCat === 'All' || exp.category === filterCat) && (!isoFilterDate || exp.date === isoFilterDate))
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
        <Text style={styles.eyebrow}>{fmt.longDate(new Date())}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{s.expenses}</Text>
          <Pressable
            onPress={() => setLangPickerVisible(true)}
            style={styles.langBtn}
            hitSlop={8}
            accessibilityLabel={s.language}
          >
            <Text style={styles.langBtnText}>🌐 {lang.toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{s.totalSpent}</Text>
          <Text style={styles.heroAmount}>{fmt.money(totalSpent)}</Text>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatValue}>{fmt.number(expenses.length)}</Text>
              <Text style={styles.heroStatLabel}>{s.transactions}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroStatValue}>
                {fmt.money(expenses.length ? totalSpent / expenses.length : 0)}
              </Text>
              <Text style={styles.heroStatLabel}>{s.average}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{s.spendingByCategory}</Text>
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
                  <Text style={styles.breakdownName}>{s.categories[c.name]}</Text>
                  <Text style={styles.breakdownPct}>{fmt.percent(c.amount / totalSpent)}</Text>
                  <View style={styles.breakdownAmountBox}>
                    <Text style={styles.breakdownAmount}>{fmt.money(c.amount)}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.emptyText}>{s.emptyBreakdown}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{s.trend}</Text>
          {trendDates.length > 0 ? (
            // Time runs left to right even in RTL layouts.
            <View style={styles.ltr}>
              <LineChart
                data={{ labels: trendDates.map(d => d.slice(5)), datasets: [{ data: trendData }] }}
                width={contentWidth - 16}
                height={180}
                yAxisLabel={fmt.currencySymbol}
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
            </View>
          ) : (
            <Text style={styles.emptyText}>{s.noTrend}</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{s.transactions}</Text>
          <View style={styles.dateFilter}>
            <TextInput
              style={styles.dateFilterInput}
              placeholder={s.filterDate}
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
                  {categoryByName[name] ? `${categoryByName[name].icon}  ${s.categories[name]}` : s.all}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🪙</Text>
            <Text style={styles.emptyTitle}>{s.noExpenses}</Text>
            <Text style={styles.emptyText}>{s.tapToAdd}</Text>
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
                    <Text style={styles.expenseMeta}>{s.categories[item.category]} · {item.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{fmt.money(-item.amount)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityLabel={s.addExpense}
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
            <Text style={styles.modalTitle}>{editId !== null ? s.editExpense : s.newExpense}</Text>

            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>{fmt.currencySymbol}</Text>
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

            <Text style={styles.fieldLabel}>{s.description}</Text>
            <TextInput
              style={styles.input}
              placeholder={s.descPlaceholder}
              placeholderTextColor={t.muted}
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={styles.fieldLabel}>{s.date}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={t.muted}
              value={date}
              onChangeText={setDate}
            />

            <Text style={styles.fieldLabel}>{s.category}</Text>
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
                    <Text style={[styles.catTileText, active && { color: cat.color }]}>{s.categories[cat.name]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={addOrEditExpense}
              disabled={!canSave}
              style={[styles.primaryBtn, !canSave && { opacity: 0.4 }]}
            >
              <Text style={styles.primaryBtnText}>{editId !== null ? s.saveChanges : s.addExpense}</Text>
            </Pressable>
            {editId !== null ? (
              <Pressable onPress={deleteExpense} style={styles.ghostBtn}>
                <Text style={[styles.ghostBtnText, { color: t.danger }]}>{s.deleteExpense}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={closeModal} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>{s.cancel}</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={langPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <View style={styles.modalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLangPickerVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{s.language}</Text>
            <ScrollView style={styles.langList}>
              {languages.map((l, i) => {
                const active = l.code === lang;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => { setLang(l.code); setLangPickerVisible(false); }}
                    style={[styles.langRow, i > 0 && styles.expenseItemBorder]}
                  >
                    <Text style={[styles.langName, active && styles.langNameActive]}>{l.name}</Text>
                    {active ? <Text style={styles.langCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

const makeStyles = (t, { rtl, letterSpacing }) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg, direction: rtl ? 'rtl' : 'ltr' },
  ltr: { direction: 'ltr' },
  container: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 120, width: '100%', maxWidth: 640, alignSelf: 'center' },
  eyebrow: { color: t.muted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: letterSpacing ? 0.8 : 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 20 },
  title: { color: t.text, fontSize: 34, fontWeight: '800', letterSpacing: letterSpacing ? -0.5 : 0, flexShrink: 1 },
  langBtn: { backgroundColor: t.chip, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginStart: 12 },
  langBtnText: { color: t.text, fontSize: 13, fontWeight: '700' },

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
  dot: { width: 10, height: 10, borderRadius: 5, marginEnd: 10 },
  breakdownName: { color: t.text, fontSize: 15, flex: 1 },
  breakdownPct: { color: t.muted, fontSize: 13, marginEnd: 12 },
  // Aligns amounts to the trailing edge in both LTR and RTL.
  breakdownAmountBox: { minWidth: 80, alignItems: 'flex-end' },
  breakdownAmount: { color: t.text, fontSize: 15, fontWeight: '600' },
  chart: { marginLeft: -16, marginBottom: -8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  sectionTitle: { color: t.text, fontSize: 20, fontWeight: '700' },
  dateFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.chip, borderRadius: 12, paddingHorizontal: 12 },
  dateFilterInput: { color: t.text, paddingVertical: 8, width: 120, fontSize: 14 },
  clearIcon: { color: t.muted, fontSize: 13, paddingStart: 6 },

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
    end: 24,
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

  // Modals render in their own native root, so direction must be set again here.
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.overlay, direction: rtl ? 'rtl' : 'ltr' },
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
  amountCurrency: { color: t.muted, fontSize: 32, fontWeight: '600', marginEnd: 4 },
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

  langList: { maxHeight: 420, marginTop: 16 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  langName: { color: t.text, fontSize: 16, fontWeight: '600' },
  langNameActive: { color: t.primary },
  langCheck: { color: t.primary, fontSize: 16, fontWeight: '700' },
});
