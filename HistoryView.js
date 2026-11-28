import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { categories } from './model';
import { categoryShade } from './theme';
import { addMonths, monthOf } from './dates';
import { dailyRate, monthlyHistory, projectMonth } from './insights';
import { Stat } from './controls';

const PAST_MONTHS = 5;
const FUTURE_MONTHS = 2;
const HISTORY_MONTHS = 12;

export default function HistoryView({ expenses, subscriptions, today, ui: { s, fmt, styles, t, wide } }) {
  const current = monthOf(today);
  const barHeight = wide ? 240 : 110;

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
        <Text style={styles.emptyText}>{s.noHistory}</Text>
      </View>
    );
  }

  const maxBar = Math.max(...bars.map(b => b.total));
  const ahead = thisMonth.scheduled + thisMonth.estimated;

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroMain}>
          <Text style={styles.heroLabel}>{s.projectedMonthEnd}</Text>
          <Text style={styles.figure} adjustsFontSizeToFit numberOfLines={1}>{fmt.money(thisMonth.total)}</Text>
          {thisMonth.total > 0 ? (
            <View style={styles.progressTrack}>
              {thisMonth.spent > 0 ? <View style={[styles.progressSpent, { flex: thisMonth.spent }]} /> : null}
              {ahead > 0 ? <View style={[styles.progressProjected, { flex: ahead }]} /> : null}
            </View>
          ) : null}
          {wide ? <Text style={styles.heroNote}>{s.projectionNote}</Text> : null}
        </View>
        <View style={styles.stats}>
          <Stat styles={styles} label={s.spentSoFar} value={fmt.money(thisMonth.spent)} />
          <Stat styles={styles} label={s.upcomingCharges} value={fmt.money(thisMonth.scheduled)} />
          <Stat styles={styles} label={s.estimatedSpending} value={fmt.money(thisMonth.estimated)} />
          <Stat styles={styles} label={s.nextMonth} value={fmt.money(nextMonth.total)} />
        </View>
        {wide ? null : <Text style={styles.note}>{s.projectionNote}</Text>}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{s.historyChart}</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendSwatch} />
              <Text style={styles.legendText}>{s.spent}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendSwatchProjected} />
              <Text style={styles.legendText}>{s.projected}</Text>
            </View>
          </View>
        </View>
        {/* Time runs left to right even in RTL layouts. */}
        <View
          style={styles.ltr}
          accessible
          accessibilityLabel={bars.map(b => `${fmt.shortMonth(b.month)} ${fmt.money(b.total)}`).join(', ')}
        >
          <View style={styles.barChart}>
            {bars.map(b => {
              const now = b.month === current;
              const projected = b.scheduled + b.estimated;
              const scale = maxBar > 0 ? barHeight / maxBar : 0;
              return (
                <View key={b.month} style={styles.barCol}>
                  {/* Narrow bars only have room to label the current month. */}
                  {wide || now ? (
                    <Text
                      style={[styles.barValue, now && styles.barValueHighlight, !wide && { marginHorizontal: -16, textAlign: 'center' }]}
                      numberOfLines={1}
                    >
                      {fmt.money(b.total)}
                    </Text>
                  ) : null}
                  {b.total > 0 ? (
                    <>
                      {projected > 0 ? (
                        <View
                          style={[
                            styles.barProjected,
                            now && styles.barProjectedHighlight,
                            { height: Math.max(2, projected * scale) },
                          ]}
                        />
                      ) : null}
                      {b.spent > 0 ? (
                        <View style={[styles.bar, now && styles.barHighlight, { height: Math.max(2, b.spent * scale) }]} />
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.barStub} />
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.barLabels}>
            {bars.map(b => (
              <Text key={b.month} style={[styles.barLabel, b.month === current && styles.barLabelCurrent]} numberOfLines={1}>
                {fmt.shortMonth(b.month)}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {rows.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{s.monthlyHistory}</Text>
          <View style={styles.list}>
            {rows.map(row => {
              const now = row.month === current;
              const change = !now && row.previous ? (row.total - row.previous) / row.previous : null;
              return (
                <View key={row.month} style={[styles.monthRow, now && styles.monthRowCurrent]}>
                  <View style={styles.monthInfo}>
                    <Text style={[styles.monthName, now && styles.monthNameCurrent]}>{fmt.monthYear(row.month)}</Text>
                    {now ? (
                      <Text style={styles.monthMeta}>
                        {s.projected}: {fmt.money(thisMonth.total)}
                      </Text>
                    ) : null}
                    {wide ? null : <MiniBar row={row} styles={styles} t={t} style={{ marginTop: 8 }} />}
                  </View>
                  {wide ? (
                    <View style={styles.miniBarBox}>
                      <MiniBar row={row} styles={styles} t={t} />
                    </View>
                  ) : null}
                  <Text style={styles.delta}>{change ? fmt.signedPercent(change) : ''}</Text>
                  <Text style={styles.monthTotal}>{fmt.money(row.total)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </>
  );
}

const MiniBar = ({ row, styles, t, style }) => (
  <View style={[styles.miniBar, style]}>
    {categories
      .filter(c => row.byCategory[c.name])
      .map(c => (
        <View
          key={c.name}
          style={[styles.segment, { flex: row.byCategory[c.name], backgroundColor: categoryShade(t, c.name) }]}
        />
      ))}
  </View>
);
