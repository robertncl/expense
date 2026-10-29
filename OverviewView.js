import React, { useState } from 'react';
import { Text, View, TextInput, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { normalizeDigits } from './i18n';
import { categories, categoryByName } from './model';

export default function OverviewView({ expenses, onEdit, ui: { s, fmt, styles, t } }) {
  const { width } = useWindowDimensions();
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

  // Prepare data for trend chart
  const dateTotals = {};
  expenses.forEach(e => {
    dateTotals[e.date] = (dateTotals[e.date] || 0) + e.amount;
  });
  const trendDates = Object.keys(dateTotals).sort().slice(-7); // last 7 days with spending
  const trendData = trendDates.map(d => dateTotals[d]);

  const contentWidth = Math.min(width, 640) - 40;

  return (
    <>
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
                onPress={() => onEdit(item)}
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
                  <Text style={styles.expenseMeta}>
                    {item.subscriptionId ? '🔁 ' : ''}{s.categories[item.category]} · {item.date}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>{fmt.money(-item.amount)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}
