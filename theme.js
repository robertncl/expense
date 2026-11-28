import { StyleSheet } from 'react-native';

// Modernist design system: black on white, rules instead of cards and shadows,
// square corners, and one blue for action and "you are here".
export const themes = {
  light: {
    paper: '#FFFFFF',
    paper2: '#F1F1EF',
    rule: '#CFCFCB',
    ink: '#111111',
    ink2: '#454542',
    ink3: '#6A6A66',
    blue: '#1E40D8',
    blueHover: '#1631A8',
    blueSoft: '#E6EBFC',
    onBlue: '#FFFFFF',
    red: '#B3170D',
    overlay: 'rgba(17, 17, 17, 0.55)',
  },
  // The system ships light only; this is the same roles inverted, so the app still follows the device.
  dark: {
    paper: '#111111',
    paper2: '#1C1C1B',
    rule: '#3A3A37',
    ink: '#F4F4F2',
    ink2: '#C4C4BF',
    ink3: '#9A9A95',
    blue: '#8EA4FF',
    blueHover: '#B4C3FF',
    blueSoft: '#1A2350',
    onBlue: '#111111',
    red: '#FF7A6E',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Categories are told apart by lightness, darkest to lightest, always with a name beside them.
export const categoryShade = (t, name) =>
  ({ Food: t.ink, Bills: t.ink2, Shopping: t.ink3, Transport: t.rule, Other: t.paper2 })[name] ?? t.paper2;

export const fontAssets = {
  Archivo_400Regular: 400,
  Archivo_500Medium: 500,
  Archivo_600SemiBold: 600,
  Archivo_700Bold: 700,
  Archivo_800ExtraBold: 800,
};
const familyByWeight = Object.fromEntries(Object.entries(fontAssets).map(([family, w]) => [w, family]));

export const makeStyles = (t, { rtl, letterSpacing, wide, fonts }) => {
  // Each weight of a loaded font is its own family; before it loads, use the system face.
  const f = w => (fonts ? { fontFamily: familyByWeight[w] } : { fontWeight: String(w) });
  const track = v => (letterSpacing ? v : 0);
  const num = { fontVariant: ['tabular-nums'] };
  const label = {
    color: t.ink2,
    fontSize: 12,
    lineHeight: 15,
    ...f(600),
    letterSpacing: track(1),
    textTransform: 'uppercase',
  };
  const control = {
    minHeight: 44,
    borderWidth: 2,
    borderColor: t.ink,
    backgroundColor: t.paper,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  };

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.paper, direction: rtl ? 'rtl' : 'ltr' },
    ltr: { direction: 'ltr' },
    topBar: { height: 8, backgroundColor: t.ink },
    container: {
      paddingTop: wide ? 24 : 40,
      paddingHorizontal: wide ? 32 : 20,
      paddingBottom: wide ? 96 : 140,
      width: '100%',
      maxWidth: 1280 + 64,
      alignSelf: 'center',
    },

    header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
    headerTitleBox: wide ? { flexDirection: 'row', alignItems: 'baseline', gap: 24, flexShrink: 1 } : { flexShrink: 1 },
    eyebrow: label,
    title: {
      color: t.ink,
      fontSize: wide ? 28 : 36,
      lineHeight: wide ? 31 : 38,
      ...f(800),
      letterSpacing: track(wide ? -0.3 : -0.7),
      marginTop: wide ? 0 : 8,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    langBtn: { ...control, paddingHorizontal: 12, gap: 6 },
    langBtnText: { color: t.ink, fontSize: 14, ...f(600) },

    tabs: { flexDirection: 'row', gap: wide ? 32 : 0, borderBottomWidth: 2, borderBottomColor: t.ink, marginTop: wide ? 32 : 24, marginBottom: wide ? 48 : 32 },
    tab: wide
      ? { paddingTop: 12, paddingBottom: 12, borderBottomWidth: 4, borderBottomColor: 'transparent', marginBottom: -2 }
      : { flexGrow: 1, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 4, borderBottomColor: 'transparent', marginBottom: -2 },
    tabActive: { borderBottomColor: t.blue },
    tabText: { color: t.ink2, fontSize: wide ? 16 : 15, ...f(600) },
    tabTextActive: { color: t.blue, ...f(700) },

    // Sections open with a 2px rule; rows are split by 1px hairlines.
    section: { borderTopWidth: 2, borderTopColor: t.ink, paddingTop: wide ? 16 : 12, marginBottom: wide ? 64 : 32 },
    sectionTitle: { color: t.ink, fontSize: wide ? 28 : 20, lineHeight: wide ? 31 : 24, ...f(700), letterSpacing: track(wide ? -0.3 : 0) },
    sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
    caption: { color: t.ink2, fontSize: 14, lineHeight: 20, marginTop: 8 },
    split: wide ? { flexDirection: 'row', gap: 24, alignItems: 'flex-start' } : {},
    splitMain: wide ? { flex: 7, minWidth: 0 } : {},
    splitSide: wide ? { flex: 5, minWidth: 0 } : {},

    hero: wide
      ? { flexDirection: 'row', gap: 24, alignItems: 'flex-end', marginBottom: 64 }
      : { marginBottom: 32 },
    heroMain: wide ? { flex: 2, minWidth: 0 } : {},
    heroLabel: label,
    figure: {
      color: t.ink,
      fontSize: wide ? 96 : 56,
      lineHeight: wide ? 90 : 54,
      ...f(700),
      letterSpacing: track(wide ? -3.8 : -2.2),
      marginTop: wide ? 16 : 12,
      ...num,
    },
    heroNote: { color: t.ink2, fontSize: 16, lineHeight: 24, marginTop: 24, maxWidth: 560 },
    stats: wide
      ? { flex: 1, minWidth: 0, borderTopWidth: 2, borderTopColor: t.ink }
      : { marginTop: 24, borderTopWidth: 1, borderTopColor: t.rule },
    statRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, paddingVertical: wide ? 16 : 10, borderBottomWidth: 1, borderBottomColor: t.rule },
    statLabel: { color: t.ink2, fontSize: 14, lineHeight: 20, flexShrink: 1 },
    statValue: { color: t.ink, fontSize: wide ? 18 : 15, ...f(700), ...num },
    note: { color: t.ink3, fontSize: 12, lineHeight: 17, marginTop: 12 },

    stackedBar: { flexDirection: 'row', height: wide ? 24 : 16, gap: 2, marginTop: wide ? 24 : 16, marginBottom: 12 },
    segment: { borderWidth: 1, borderColor: t.ink },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.rule },
    swatch: { width: 12, height: 12, borderWidth: 1, borderColor: t.ink },
    breakdownName: { color: t.ink, fontSize: 16, flex: 1 },
    breakdownPct: { color: t.ink2, fontSize: 14, ...num },
    // Aligns amounts to the trailing edge in both LTR and RTL.
    breakdownAmountBox: { minWidth: 88, alignItems: 'flex-end' },
    breakdownAmount: { color: t.ink, fontSize: 16, ...f(600), ...num },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: wide ? 24 : 10, borderBottomWidth: 2, borderBottomColor: t.ink, marginTop: 24 },
    barCol: { flex: 1, minWidth: 0 },
    barValue: { color: t.ink2, fontSize: wide ? 14 : 11, marginBottom: 6, ...num },
    barValueHighlight: { color: t.blue, ...f(700) },
    bar: { backgroundColor: t.ink },
    barHighlight: { backgroundColor: t.blue },
    barProjected: { borderWidth: 2, borderBottomWidth: 0, borderStyle: 'dashed', borderColor: t.ink },
    barProjectedHighlight: { borderColor: t.blue },
    barStub: { height: 2, backgroundColor: t.rule },
    barLabels: { flexDirection: 'row', gap: wide ? 24 : 10, marginTop: 8 },
    barLabel: { flex: 1, minWidth: 0, color: t.ink3, fontSize: 12 },
    barLabelCurrent: { color: t.ink, ...f(700) },
    legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendSwatch: { width: 12, height: 12, backgroundColor: t.ink },
    legendSwatchProjected: { width: 12, height: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: t.ink },
    legendText: { color: t.ink2, fontSize: 12 },

    progressTrack: { flexDirection: 'row', height: 8, gap: 2, marginTop: 20 },
    progressSpent: { backgroundColor: t.ink },
    progressProjected: { borderWidth: 2, borderStyle: 'dashed', borderColor: t.ink },

    filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, marginTop: 24 },
    fieldBox: { gap: 4 },
    chipRow: { gap: 8, paddingVertical: 2 },
    chip: { ...control },
    chipActive: { borderColor: t.blue, backgroundColor: t.blueSoft },
    chipText: { color: t.ink, fontSize: 14, ...f(600) },
    chipTextActive: { color: t.blue, ...f(700) },
    dateFilter: { ...control, paddingHorizontal: 0, paddingStart: 16, paddingEnd: 4, gap: 0, width: 220 },
    dateFilterInput: { flex: 1, color: t.ink, fontSize: 16, paddingVertical: 10, ...f(400), ...num },
    clearBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    list: { marginTop: wide ? 24 : 8, borderTopWidth: 1, borderTopColor: t.rule },
    listHead: { flexDirection: 'row', gap: 16, paddingBottom: 8, marginTop: 24 },
    listHeadText: { ...label, color: t.ink3 },
    expenseItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: wide ? 16 : 12, borderBottomWidth: 1, borderBottomColor: t.rule },
    expenseItemPressed: { backgroundColor: t.paper2 },
    colDate: { width: 120, color: t.ink2, fontSize: 14 },
    colCategory: { width: 180, color: t.ink2, fontSize: 16 },
    expenseDesc: { color: t.ink, fontSize: 16, lineHeight: 22, ...f(600) },
    expenseMeta: { color: t.ink2, fontSize: 14, lineHeight: 20, marginTop: 2 },
    tag: { ...label, fontSize: 11, color: t.ink3 },
    expenseAmount: { color: t.ink, fontSize: 16, ...f(700), ...num },
    dateBox: { width: 48 },
    dateBoxDay: { ...label, color: t.ink3 },
    dateBoxNum: { color: t.ink, fontSize: 20, lineHeight: 24, ...f(700), ...num },
    dateBoxSoon: { color: t.blue },

    emptyState: { paddingVertical: 24, gap: 4 },
    emptyTitle: { color: t.ink, fontSize: 18, lineHeight: 23, ...f(700) },
    emptyText: { color: t.ink2, fontSize: 14, lineHeight: 20 },

    primaryBtn: { minHeight: 52, backgroundColor: t.blue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
    primaryBtnHeader: { minHeight: 44 },
    primaryBtnPressed: { backgroundColor: t.blueHover },
    primaryBtnText: { color: t.onBlue, fontSize: 16, ...f(600) },
    secondaryBtn: { ...control },
    secondaryBtnPressed: { backgroundColor: t.ink },
    secondaryBtnText: { color: t.ink, fontSize: 14, ...f(600) },
    secondaryBtnTextPressed: { color: t.paper },
    textBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    textBtnText: { color: t.blue, fontSize: 15, ...f(600) },
    dangerBtnText: { color: t.red, fontSize: 15, ...f(600) },
    disabled: { opacity: 0.4 },
    bottomBar: {
      position: 'absolute',
      start: 0,
      end: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      backgroundColor: t.paper,
      borderTopWidth: 2,
      borderTopColor: t.ink,
    },

    // Modals render in their own native root, so direction must be set again here.
    modalBg: { flex: 1, justifyContent: wide ? 'center' : 'flex-end', backgroundColor: t.overlay, direction: rtl ? 'rtl' : 'ltr' },
    sheet: {
      backgroundColor: t.paper,
      borderTopWidth: 8,
      borderTopColor: t.ink,
      paddingHorizontal: wide ? 32 : 20,
      paddingTop: 20,
      paddingBottom: 32,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    sheetTall: { maxHeight: '92%' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
    modalTitle: { color: t.ink, fontSize: 28, lineHeight: 31, ...f(700), letterSpacing: track(-0.3), flexShrink: 1 },
    fieldLabel: { ...label, marginBottom: 4 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, borderBottomWidth: 2, borderBottomColor: t.ink, paddingBottom: 8, marginBottom: 24, marginTop: 4 },
    amountCurrency: { color: t.ink2, fontSize: 32, ...f(600) },
    amountInput: { flex: 1, minWidth: 0, color: t.ink, fontSize: 56, lineHeight: 64, ...f(700), letterSpacing: track(-2.2), padding: 0, ...num },
    input: {
      color: t.ink,
      backgroundColor: t.paper,
      borderWidth: 2,
      borderColor: t.ink,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      ...f(400),
      marginBottom: 20,
    },
    fieldNote: { color: t.ink3, fontSize: 12, lineHeight: 17, marginTop: -14, marginBottom: 20 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
    catTile: { ...control, minHeight: 48, flexBasis: '31%', flexGrow: 1, paddingHorizontal: 8 },
    catTileText: { color: t.ink, fontSize: 15, ...f(600) },
    catTileTextActive: { color: t.blue, ...f(700) },
    sheetActions: { gap: 8 },
    sheetSecondary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 4 },
    cycleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    cycleChip: { ...control, flex: 1, paddingHorizontal: 8 },

    langList: { maxHeight: 440, borderTopWidth: 1, borderTopColor: t.rule },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: 1, borderBottomColor: t.rule },
    langRowActive: { backgroundColor: t.blueSoft, paddingHorizontal: 12, marginHorizontal: -12 },
    langName: { color: t.ink, fontSize: 16, ...f(600) },
    langNameActive: { color: t.blue, ...f(700) },

    monthRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: wide ? 16 : 12, borderBottomWidth: 1, borderBottomColor: t.rule },
    monthRowCurrent: { backgroundColor: t.blueSoft, paddingHorizontal: 12, marginHorizontal: -12 },
    monthInfo: { width: wide ? 200 : undefined, flex: wide ? undefined : 1 },
    monthName: { color: t.ink, fontSize: 16, lineHeight: 22, ...f(600) },
    monthNameCurrent: { color: t.blue, ...f(700) },
    monthMeta: { color: t.ink2, fontSize: 14, lineHeight: 20, marginTop: 2 },
    miniBarBox: { flex: 1, minWidth: 0 },
    miniBar: { flexDirection: 'row', height: 8, gap: 2, maxWidth: 360 },
    delta: { color: t.ink, fontSize: 14, ...f(700), minWidth: 56, textAlign: 'right', ...num },
    monthTotal: { color: t.ink, fontSize: 16, ...f(700), minWidth: 96, textAlign: 'right', ...num },
  });
};
