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
  useWindowDimensions,
} from 'react-native';
import { useFonts } from 'expo-font';
// Per-weight imports, so only the five weights in use are bundled.
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
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
import { CategoryPicker, PrimaryButton, SheetHeader } from './controls';
import { CheckIcon, GlobeIcon, PlusIcon } from './icons';

// Keep the splash screen up until saved data has loaded.
SplashScreen.preventAutoHideAsync();

const tabs = ['overview', 'history', 'subscriptions'];

export default function App() {
  const scheme = useColorScheme();
  const t = themes[scheme === 'dark' ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  // Wide screens (tablets, desktop web) get the header action and two-column sections.
  const wide = width >= 900;
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  // A font that fails to load falls back to the system face rather than blocking the app.
  const fontsSettled = fontsLoaded || !!fontError;
  const [lang, setLang] = useState(detectLanguage);
  // The language the user picked, saved so it survives restarts; null follows the device.
  const [pickedLang, setPickedLang] = useState(null);
  const rtl = !!languageByCode[lang].rtl;
  const s = useMemo(() => ({ ...strings.en, ...strings[lang] }), [lang]);
  const fmt = useMemo(() => makeFormatters(lang), [lang]);
  const styles = useMemo(
    () => makeStyles(t, { rtl, letterSpacing: allowsLetterSpacing(lang), wide, fonts: fontsLoaded }),
    [t, rtl, lang, wide, fontsLoaded],
  );
  const ui = useMemo(() => ({ s, fmt, styles, t, wide }), [s, fmt, styles, t, wide]);

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
    });
  }, []);

  useEffect(() => {
    if (loaded && fontsSettled) SplashScreen.hideAsync();
  }, [loaded, fontsSettled]);

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


  if (!loaded || !fontsSettled) return null;

  const onSubscriptionsTab = tab === 'subscriptions';
  const addLabel = onSubscriptionsTab ? s.addSubscription : s.addExpense;
  const onAdd = onSubscriptionsTab ? () => openSubscription(null) : openAdd;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerTitleBox}>
            {wide ? <Text style={styles.title} accessibilityRole="header">{s.expenses}</Text> : null}
            <Text style={styles.eyebrow}>{fmt.longDate(new Date())}</Text>
            {wide ? null : <Text style={styles.title} accessibilityRole="header">{s.expenses}</Text>}
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setLangPickerVisible(true)}
              style={styles.langBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${s.language}: ${languageByCode[lang].name}`}
            >
              <GlobeIcon color={t.ink} />
              <Text style={styles.langBtnText}>{wide ? languageByCode[lang].name : lang.toUpperCase()}</Text>
            </Pressable>
            {wide ? (
              <PrimaryButton
                label={addLabel}
                onPress={onAdd}
                icon={<PlusIcon color={t.onBlue} />}
                style={styles.primaryBtnHeader}
                ui={ui}
              />
            ) : null}
          </View>
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

        {tab === 'overview' && (
          <OverviewView expenses={expenses} onEdit={startEdit} ui={ui} />
        )}
        {tab === 'history' && (
          <HistoryView expenses={expenses} subscriptions={subscriptions} today={today} ui={ui} />
        )}
        {onSubscriptionsTab && (
          <SubscriptionsView subscriptions={subscriptions} today={today} onEdit={openSubscription} ui={ui} />
        )}
      </ScrollView>

      {wide ? null : (
        <View style={styles.bottomBar}>
          <PrimaryButton label={addLabel} onPress={onAdd} icon={<PlusIcon color={t.onBlue} />} ui={ui} />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} accessibilityLabel={s.cancel} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <SheetHeader title={editId !== null ? s.editExpense : s.newExpense} onClose={closeModal} ui={ui} />

              <View style={styles.amountRow}>
                <Text style={styles.amountCurrency}>{fmt.currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={t.ink3}
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
                placeholderTextColor={t.ink3}
                value={desc}
                onChangeText={setDesc}
              />

              <Text style={styles.fieldLabel}>{s.date}</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={t.ink3}
                value={date}
                onChangeText={setDate}
              />

              <CategoryPicker value={category} onChange={setCategory} ui={ui} />

              <View style={styles.sheetActions}>
                <PrimaryButton
                  label={editId !== null ? s.saveChanges : s.addExpense}
                  onPress={addOrEditExpense}
                  disabled={!canSave}
                  ui={ui}
                />
                {editId !== null ? (
                  <View style={styles.sheetSecondary}>
                    <Pressable onPress={deleteExpense} style={styles.textBtn} accessibilityRole="button">
                      <Text style={styles.dangerBtnText}>{s.deleteExpense}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </ScrollView>
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
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLangPickerVisible(false)}
            accessibilityLabel={s.cancel}
          />
          <View style={styles.sheet}>
            <SheetHeader title={s.language} onClose={() => setLangPickerVisible(false)} ui={ui} />
            <ScrollView style={styles.langList}>
              {languages.map(l => {
                const active = l.code === lang;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => { setLang(l.code); setPickedLang(l.code); setLangPickerVisible(false); }}
                    style={[styles.langRow, active && styles.langRowActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                  >
                    <Text style={[styles.langName, active && styles.langNameActive]}>{l.name}</Text>
                    {active ? <CheckIcon color={t.blue} /> : null}
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
