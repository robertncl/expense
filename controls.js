import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { categories } from './model';
import { CloseIcon } from './icons';

// The one primary action on a view: a blue fill.
export const PrimaryButton = ({ label, onPress, disabled, icon, style, ui: { styles } }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityState={{ disabled: !!disabled }}
    style={({ pressed }) => [styles.primaryBtn, style, pressed && styles.primaryBtnPressed, disabled && styles.disabled]}
  >
    {icon}
    <Text style={styles.primaryBtnText}>{label}</Text>
  </Pressable>
);

// Every other button: a 2px ink border that fills with ink when pressed.
export const SecondaryButton = ({ label, onPress, ui: { styles } }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
  >
    {({ pressed }) => <Text style={[styles.secondaryBtnText, pressed && styles.secondaryBtnTextPressed]}>{label}</Text>}
  </Pressable>
);

export const SheetHeader = ({ title, onClose, ui: { s, styles, t } }) => (
  <View style={styles.sheetHeader}>
    <Text style={styles.modalTitle} accessibilityRole="header">{title}</Text>
    <Pressable onPress={onClose} style={styles.textBtn} accessibilityRole="button" hitSlop={8}>
      <CloseIcon color={t.blue} />
      <Text style={styles.textBtnText}>{s.cancel}</Text>
    </Pressable>
  </View>
);

export const CategoryPicker = ({ value, onChange, ui: { s, styles } }) => (
  <>
    <Text style={styles.fieldLabel}>{s.category}</Text>
    <View style={styles.catGrid} accessibilityRole="radiogroup">
      {categories.map(cat => {
        const active = value === cat.name;
        return (
          <Pressable
            key={cat.name}
            onPress={() => onChange(cat.name)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.catTile, active && styles.chipActive]}
          >
            <Text style={[styles.catTileText, active && styles.catTileTextActive]} numberOfLines={1}>
              {s.categories[cat.name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </>
);

// A label and its value on one hairline row.
export const Stat = ({ styles, label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);
