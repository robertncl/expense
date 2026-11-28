import React, { useState } from 'react';
import { Text, View, TextInput, ScrollView, Pressable } from 'react-native';
import { normalizeDigits } from './i18n';
import { categories } from './model';
import { categoryShade } from './theme';
import { CloseIcon, RepeatIcon } from './icons';
import { Stat } from './controls';

const TREND_DAYS = 7;

export default function OverviewView({ expenses, onEdit, ui: { s, fmt, styles, t, wide } }) {
  const [filterCat, setFilterCat] = useState('All');
  const [filterDate, setFilterDate] = useState('');

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

  // The last days with spending, each a bar; the highest is the one takeaway, in blue.
  const dateTotals = {};
  expenses.forEach(e => {
    dateTotals[e.date] = (dateTotals[e.date] || 0) + e.amount;
  });
  const trend = Object.keys(dateTotals).sort().slice(-TREND_DAYS).map(date => ({ date, total: dateTotals[date] }));
  const trendMax = Math.max(0, ...trend.map(d => d.total));
  const peak = trend.find(d => d.total === trendMax)?.date;
  const barHeight = wide ? 200 : 120;

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroMain}>
          <Text style={styles.heroLabel}>{s.totalSpent}</Text>
          <Text style={styles.figure} adjustsFontSizeToFit numberOfLines={1}>{fmt.money(totalSpent)}</Text>
        </View>
        <View style={styles.stats}>
          <Stat styles={styles} label={s.transactions} value={fmt.number(expenses.length)} />
          <Stat
            styles={styles}
            label={s.average}
            value={fmt.money(expenses.length ? totalSpent / expenses.length : 0)}
          />
        </View>
      </View>

      <View style={styles.split}>
        <View style={[styles.section, styles.splitMain]}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{s.spendingByCategory}</Text>
          {categoryTotals.length > 0 ? (
            <>
              <View
                style={styles.stackedBar}
                accessible
                accessibilityLabel={categoryTotals
                  .map(c => `${s.categories[c.name]} ${fmt.percent(c.amount / totalSpent)}`)
                  .join(', ')}
              >
                {categoryTotals.map(c => (
                  <View key={c.name} style={[styles.segment, { flex: c.amount, backgroundColor: categoryShade(t, c.name) }]} />
                ))}
              </View>
              {categoryTotals.map(c => (
                <View key={c.name} style={styles.breakdownRow}>
                  <View style={[styles.swatch, { backgroundColor: categoryShade(t, c.name) }]} />
                  <Text style={styles.breakdownName}>{s.categories[c.name]}</Text>
                  <Text style={styles.breakdownPct}>{fmt.percent(c.amount / totalSpent)}</Text>
                  <View style={styles.breakdownAmountBox}>
                    <Text style={styles.breakdownAmount}>{fmt.money(c.amount)}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.caption}>{s.emptyBreakdown}</Text>
          )}
        </View>

        <View style={[styles.section, styles.splitSide]}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{s.trend}</Text>
          {trend.length > 0 ? (
            // Time runs left to right even in RTL layouts.
            <View
              style={styles.ltr}
              accessible
              accessibilityLabel={trend.map(d => `${fmt.shortDate(d.date)} ${fmt.money(d.total)}`).join(', ')}
            >
              <View style={styles.barChart}>
                {trend.map(d => {
                  const top = d.date === peak;
                  return (
                    <View key={d.date} style={styles.barCol}>
                      {/* Narrow bars only have room to label the peak. */}
                      {wide || top ? (
                        <Text style={[styles.barValue, top && styles.barValueHighlight, !wide && { marginHorizontal: -16 }]} numberOfLines={1}>
                          {fmt.money(d.total)}
                        </Text>
                      ) : null}
                      <View style={[styles.bar, top && styles.barHighlight, { height: Math.max(2, (barHeight * d.total) / trendMax) }]} />
                    </View>
                  );
                })}
              </View>
              <View style={styles.barLabels}>
                {trend.map(d => (
                  <Text key={d.date} style={[styles.barLabel, d.date === peak && styles.barLabelCurrent]} numberOfLines={1}>
                    {fmt.shortDate(d.date)}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.caption}>{s.noTrend}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{s.transactions}</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel} nativeID="date-filter-label">{s.filterDate}</Text>
            <View style={styles.dateFilter}>
              <TextInput
                style={styles.dateFilterInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={t.ink3}
                value={filterDate}
                onChangeText={setFilterDate}
                accessibilityLabelledBy="date-filter-label"
                accessibilityLabel={s.filterDate}
              />
              {filterDate ? (
                <Pressable
                  onPress={() => setFilterDate('')}
                  style={styles.clearBtn}
                  accessibilityRole="button"
                  accessibilityLabel={s.all}
                >
                  <CloseIcon color={t.ink} size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={{ marginTop: wide ? 24 : 16 }}
        >
          {['All', ...categories.map(c => c.name)].map(name => {
            const active = filterCat === name;
            return (
              <Pressable
                key={name}
                onPress={() => setFilterCat(name)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {name === 'All' ? s.all : s.categories[name]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{s.noExpenses}</Text>
            <Text style={styles.emptyText}>{s.tapToAdd}</Text>
          </View>
        ) : (
          <>
            {wide ? (
              <View style={styles.listHead}>
                <Text style={[styles.listHeadText, { width: 120 }]}>{s.date}</Text>
                <Text style={[styles.listHeadText, { flex: 1 }]}>{s.description}</Text>
                <Text style={[styles.listHeadText, { width: 180 }]}>{s.category}</Text>
                <Text style={styles.listHeadText}>{s.spent}</Text>
              </View>
            ) : null}
            <View style={[styles.list, wide && { marginTop: 0 }]}>
              {filteredExpenses.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => onEdit(item)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.expenseItem, pressed && styles.expenseItemPressed]}
                >
                  {wide ? <Text style={styles.colDate}>{fmt.rowDate(item.date)}</Text> : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.expenseDesc, { flexShrink: 1 }]} numberOfLines={1}>{item.desc}</Text>
                      {item.subscriptionId ? <RepeatIcon color={t.ink3} size={16} /> : null}
                    </View>
                    {wide ? null : (
                      <Text style={styles.expenseMeta}>
                        {s.categories[item.category]} · {fmt.rowDate(item.date)}
                      </Text>
                    )}
                  </View>
                  {wide ? <Text style={styles.colCategory}>{s.categories[item.category]}</Text> : null}
                  <Text style={styles.expenseAmount}>{fmt.money(-item.amount)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );
}
