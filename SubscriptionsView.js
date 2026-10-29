import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { categoryByName } from './model';
import { monthlyCost, nextCharge } from './subscriptions';

export default function SubscriptionsView({ subscriptions, today, onEdit, ui: { s, fmt, styles } }) {
  const monthly = subscriptions.reduce((sum, sub) => sum + monthlyCost(sub), 0);
  const upcoming = subscriptions
    .map(sub => ({ sub, next: nextCharge(sub, today) }))
    .sort((a, b) => a.next.localeCompare(b.next));

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{s.monthlyCost}</Text>
        <Text style={styles.heroAmount}>{fmt.money(monthly)}</Text>
        <View style={styles.heroStats}>
          <View>
            <Text style={styles.heroStatValue}>{fmt.number(subscriptions.length)}</Text>
            <Text style={styles.heroStatLabel}>{s.activeSubscriptions}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View>
            <Text style={styles.heroStatValue}>{fmt.money(monthly * 12)}</Text>
            <Text style={styles.heroStatLabel}>{s.perYear}</Text>
          </View>
        </View>
      </View>

      {upcoming.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔁</Text>
          <Text style={styles.emptyTitle}>{s.noSubscriptions}</Text>
          <Text style={styles.emptyText}>{s.tapToAddSubscription}</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{s.upcomingCharges}</Text>
          </View>
          <View style={styles.listCard}>
            {upcoming.map(({ sub, next }, i) => {
              const cat = categoryByName[sub.category];
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => onEdit(sub)}
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
                    <Text style={styles.expenseDesc} numberOfLines={1}>{sub.name}</Text>
                    <Text style={styles.expenseMeta}>
                      {s.cycles[sub.cycle]} · {s.nextCharge} {fmt.shortDate(next)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{fmt.money(sub.amount)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}
