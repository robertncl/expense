import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { addDays } from './dates';
import { monthlyCost, nextCharge } from './subscriptions';
import { Stat } from './controls';

export default function SubscriptionsView({ subscriptions, today, onEdit, ui: { s, fmt, styles } }) {
  const monthly = subscriptions.reduce((sum, sub) => sum + monthlyCost(sub), 0);
  const upcoming = subscriptions
    .map(sub => ({ sub, next: nextCharge(sub, today) }))
    .sort((a, b) => a.next.localeCompare(b.next));
  // Charges in the next two days are marked in blue.
  const soon = addDays(today, 2);

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroMain}>
          <Text style={styles.heroLabel}>{s.monthlyCost}</Text>
          <Text style={styles.figure} adjustsFontSizeToFit numberOfLines={1}>{fmt.money(monthly)}</Text>
        </View>
        <View style={styles.stats}>
          <Stat styles={styles} label={s.activeSubscriptions} value={fmt.number(subscriptions.length)} />
          <Stat styles={styles} label={s.perYear} value={fmt.money(monthly * 12)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">{s.upcomingCharges}</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{s.noSubscriptions}</Text>
            <Text style={styles.emptyText}>{s.tapToAddSubscription}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {upcoming.map(({ sub, next }) => {
              const isSoon = next <= soon;
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => onEdit(sub)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.expenseItem, pressed && styles.expenseItemPressed]}
                >
                  <View style={styles.dateBox}>
                    <Text style={[styles.dateBoxDay, isSoon && styles.dateBoxSoon]}>{fmt.weekday(next)}</Text>
                    <Text style={[styles.dateBoxNum, isSoon && styles.dateBoxSoon]}>{fmt.day(next)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>{sub.name}</Text>
                    <Text style={styles.expenseMeta}>
                      {s.categories[sub.category]} · {s.cycles[sub.cycle]} · {s.nextCharge} {fmt.shortDate(next)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{fmt.money(sub.amount)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}
