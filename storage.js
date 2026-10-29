import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeState } from './model';

const KEY = 'expense-tracker/state';

// `writable` is false when saved data could not be read or set aside, so the app never
// overwrites data it failed to load.
export const loadState = async () => {
  const empty = sanitizeState(null);
  let raw;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch (e) {
    console.warn('Could not read saved data', e);
    return { data: empty, writable: false };
  }
  if (raw === null) return { data: empty, writable: true };
  try {
    return { data: sanitizeState(JSON.parse(raw)), writable: true };
  } catch (e) {
    console.warn('Saved data is not valid JSON; keeping a copy and starting fresh', e);
    try {
      await AsyncStorage.setItem(`${KEY}.unreadable`, raw);
      return { data: empty, writable: true };
    } catch {
      return { data: empty, writable: false };
    }
  }
};

export const saveState = state => AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, ...state }));
