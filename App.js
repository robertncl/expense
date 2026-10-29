import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  AppState,
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
} from 'react-native';
import {
  languages,
  languageByCode,
  strings,
  detectLanguage,
  isLanguage,
  makeFormatters,
  normalizeDigits,
  parseAmount,
  allowsLetterSpacing,
} from './i18n';
import { categories } from './model';
import { themes, makeStyles } from './theme';
import { isISODate, localToday } from './dates';
import { postCharges } from './subscriptions';
import { loadState, saveState } from './storage';
import OverviewView from './OverviewView';
import HistoryView from './HistoryView';
import SubscriptionsView from './SubscriptionsView';
import SubscriptionSheet from './SubscriptionSheet';

// Keep the splash screen up until saved data has loaded.
SplashScreen.preventAutoHideAsync();

const tabs = ['overview', 'history', 'subscriptions'];

export default function App() {
  const scheme = useColorScheme();
  const t = themes[scheme === 'dark' ? 'dark' : 'light'];
  const [lang, setLang] = useState(detectLanguage);
  // The language the user picked, saved so it survives restarts; null follows the device.
  const [pickedLang, setPickedLang] = useState(null);
  const rtl = !!languageByCode[lang].rtl;
  const s = useMemo(() => ({ ...strings.en, ...strings[lang] }), [lang]);
  const fmt = useMemo(() => makeFormatters(lang), [lang]);
  const styles = useMemo(
    () => makeStyles(t, { rtl, letterSpacing: allowsLetterSpacing(lang) }),
    [t, rtl, lang],
  );
  const ui = useMemo(() => ({ s, fmt, styles, t }), [s, fmt, styles, t]);

  const [loaded, setLoaded] = useState(false);
  const writable = useRef(false);
  const [today, setToday] = useState(localToday);
  const [tab, setTab] = useState('overview');
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subSheet, setSubSheet] = useState({ visible: false, subscription: null });
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0].name);
  const [date, setDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadState().then(({ data, writable: canWrite }) => {
      writable.current = canWrite;
      setExpenses(data.expenses);
      setSubscriptions(data.subscriptions);
      if (isLanguage(data.lang)) {
        setLang(data.lang);
        setPickedLang(data.lang);
      }
      setLoaded(true);
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (!loaded || !writable.current) return;
    saveState({ expenses, subscriptions, lang: pickedLang }).catch(e => console.warn('Could not save data', e));
  }, [loaded, expenses, subscriptions, pickedLang]);

  // Add subscription charges as they come due.
  useEffect(() => {
    if (!loaded) return;
    const posted = postCharges(subscriptions, expenses, today);
    if (posted) {
      setSubscriptions(posted.subscriptions);
      setExpenses(posted.expenses);
    }
  }, [loaded, subscriptions, expenses, today]);

  // The app can stay open across midnight; pick up the new date when it comes back.
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') setToday(localToday());
    });
    return () => listener.remove();
  }, []);

  const resetForm = () => {
    setDesc(''); setAmount(''); setCategory(categories[0].name); setDate(today); setEditId(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); resetForm(); };

  const parsedAmount = parseAmount(amount, fmt.decimal);
  const isoDate = normalizeDigits(date);
  const canSave = desc.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0 && isISODate(isoDate);

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

  const openSubscription = subscription => setSubSheet({ visible: true, subscription });
  // Keep the subscription while the sheet slides away, so its content doesn't change.
  const closeSubscription = () => setSubSheet(prev => ({ ...prev, visible: false }));

  const saveSubscription = sub => {
    setSubscriptions(prev =>
      prev.some(x => x.id === sub.id)
        ? prev.map(x => (x.id === sub.id ? { ...sub, postedThrough: x.postedThrough } : x))
        : [...prev, sub],
    );
    closeSubscription();
  };

  // Ending keeps the charges already added; deleting removes them too.
  const endSubscription = id => {
    setSubscriptions(prev => prev.filter(x => x.id !== id));
    closeSubscription();
  };
  const deleteSubscription = id => {
    setSubscriptions(prev => prev.filter(x => x.id !== id));
    setExpenses(prev => prev.filter(e => e.subscriptionId !== id));
    closeSubscription();
  };

  if (!loaded) return null;

  const onSubscriptionsTab = tab === 'subscriptions';

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

        <View style={styles.tabs} accessibilityRole="tablist">
          {tabs.map(key => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, active && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                  {s[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'overview' && <OverviewView expenses={expenses} onEdit={startEdit} ui={ui} />}
        {tab === 'history' && (
          <HistoryView expenses={expenses} subscriptions={subscriptions} today={today} ui={ui} />
        )}
        {onSubscriptionsTab && (
          <SubscriptionsView subscriptions={subscriptions} today={today} onEdit={openSubscription} ui={ui} />
        )}
      </ScrollView>

      <Pressable
        onPress={onSubscriptionsTab ? () => openSubscription(null) : openAdd}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityLabel={onSubscriptionsTab ? s.addSubscription : s.addExpense}
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

      <SubscriptionSheet
        visible={subSheet.visible}
        subscription={subSheet.subscription}
        today={today}
        onSave={saveSubscription}
        onEnd={endSubscription}
        onDelete={deleteSubscription}
        onClose={closeSubscription}
        ui={ui}
      />

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
                    onPress={() => { setLang(l.code); setPickedLang(l.code); setLangPickerVisible(false); }}
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
