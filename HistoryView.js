import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { categories } from './model';
import { addMonths, monthOf } from './dates';
import { dailyRate, monthlyHistory, projectMonth } from './insights';

const PAST_MONTHS = 5;
const FUTURE_MONTHS = 2;
const HISTORY_MONTHS = 12;
const BAR_HEIGHT = 140;

export default function HistoryView({ expenses, subscriptions, today, ui: { s, fmt, styles, t } }) {
  const current = monthOf(today);

  const { thisMonth, nextMonth, bars, rows } = useMemo(() => {
    const ctx = { expenses, subscriptions, today, rate: dailyRate(expenses, today) };
    const history = monthlyHistory(expenses, current, HISTORY_MONTHS, today);
    const first = history.findIndex(r => r.total > 0);
    // Newest first, from the first month with spending; each row knows the month before it.
    const rows = (first === -1 ? [] : history.slice(first))
      .map((row, i, all) => ({ ...row, previous: i > 0 ? all[i - 1].total : null }))
      .reverse();
    return {
      thisMonth: projectMonth(current, ctx),
      nextMonth: projectMonth(addMonths(current, 1), ctx),
      bars: Array.from({ length: PAST_MONTHS + 1 + FUTURE_MONTHS }, (_, i) => {
        const month = addMonths(current, i - PAST_MONTHS);
        return { month, ...projectMonth(month, ctx) };
      }),
      rows,
    };
  }, [expenses, subscriptions, today, current]);

  if (!expenses.length && !subscriptions.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📈</Text>
        <Text style={styles.emptyText}>{s.noHistory}</Text>
      </View>
    );
  }

  const projectedColor = t.primary + '55';
  const maxBar = Math.max(...bars.map(b => b.total));

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{s.thisMonth}</Text>
        <Text style={styles.bigLabel}>{s.projectedMonthEnd}</Text>
        <Text style={styles.bigValue}>{fmt.money(thisMonth.total)}</Text>
        <View style={styles.progressTrack}>
          <View style={{ flex: thisMonth.spent, backgroundColor: t.primary }} />
          <View style={{ flex: thisMonth.scheduled + thisMonth.estimated, backgroundColor: projectedColor }} />
        </View>
        <StatRow styles={styles} label={s.spentSoFar} value={fmt.money(thisMonth.spent)} />
        <StatRow styles={styles} label={s.upcomingCharges} value={fmt.money(thisMonth.scheduled)} />
        <StatRow styles={styles} label={s.estimatedSpending} value={fmt.money(thisMonth.estimated)} />
        <View style={styles.divider} />
        <StatRow styles={styles} label={s.nextMonth} value={fmt.money(nextMonth.total)} />
        <Text style={styles.note}>{s.projectionNote}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{s.historyChart}</Text>
        {/* Time runs left to right even in RTL layouts. */}
        <View style={[styles.barChart, styles.ltr]}>
          {bars.map(b => (
            <View key={b.month} style={styles.barCol}>
              <View style={styles.barTrack}>
                {b.total > 0 ? (
                  <View style={[styles.bar, { height: Math.max(2, (BAR_HEIGHT * b.total) / maxBar) }]}>
                    <View style={{ flex: b.scheduled + b.estimated, backgroundColor: projectedColor }} />
                    <View style={{ flex: b.spent, backgroundColor: t.primary }} />
                  </View>
                ) : (
                  <View style={styles.barStub} />
                )}
              </View>
              <Text style={[styles.barLabel, b.month === current && styles.barLabelCurrent]} numberOfLines={1}>
                {fmt.shortMonth(b.month)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <LegendItem styles={styles} color={t.primary} label={s.spent} />
          <LegendItem styles={styles} color={projectedColor} label={s.projected} />
        </View>
      </View>

      {rows.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{s.monthlyHistory}</Text>
          </View>
          <View style={styles.listCard}>
            {rows.map((row, i) => {
              const change = row.month !== current && row.previous ? (row.total - row.previous) / row.previous : null;
              return (
                <View key={row.month} style={[styles.monthRow, i > 0 && styles.expenseItemBorder]}>
                  <View style={styles.monthRowTop}>
                    <Text style={styles.monthName}>{fmt.monthYear(row.month)}</Text>
                    {change ? (
                      <Text style={[styles.delta, { color: change > 0 ? t.danger : t.success }]}>
                        {change > 0 ? '▲' : '▼'} {fmt.percent(Math.abs(change))}
                      </Text>
                    ) : null}
                    <Text style={styles.monthTotal}>{fmt.money(row.total)}</Text>
                  </View>
                  {row.month === current ? (
                    <Text style={styles.monthMeta}>
                      {s.projected}: {fmt.money(thisMonth.total)}
                    </Text>
                  ) : null}
                  <View style={styles.miniBar}>
                    {categories
                      .filter(c => row.byCategory[c.name])
                      .map(c => (
                        <View key={c.name} style={{ flex: row.byCategory[c.name], backgroundColor: c.color }} />
                      ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </>
  );
}

const StatRow = ({ styles, label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const LegendItem = ({ styles, color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);
