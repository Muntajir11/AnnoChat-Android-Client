import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEYS, type CameraFacing } from '../lib/settings';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [filterOn, setFilterOn] = useState(true);
  const [camera, setCamera] = useState<CameraFacing>('user');

  useEffect(() => {
    void (async () => {
      const n = await AsyncStorage.getItem(SETTINGS_KEYS.notifications);
      const f = await AsyncStorage.getItem(SETTINGS_KEYS.filter);
      const c = await AsyncStorage.getItem(SETTINGS_KEYS.camera);
      if (n !== null) setNotifications(n !== '0');
      if (f !== null) setFilterOn(f !== '0');
      if (c === 'environment' || c === 'user') setCamera(c);
    })();
  }, []);

  const persist = (key: string, value: string) => {
    void AsyncStorage.setItem(key, value);
  };

  const clearLocal = () => {
    Alert.alert('Clear local data?', 'Cached settings and the 18+ confirmation will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(Object.values(SETTINGS_KEYS));
          setNotifications(true);
          setFilterOn(true);
          setCamera('user');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={(v) => {
              setNotifications(v);
              persist(SETTINGS_KEYS.notifications, v ? '1' : '0');
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Keyword filter</Text>
          <Switch
            value={filterOn}
            onValueChange={(v) => {
              setFilterOn(v);
              persist(SETTINGS_KEYS.filter, v ? '1' : '0');
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Default camera</Text>
          <TouchableOpacity
            onPress={() => {
              const next = camera === 'user' ? 'environment' : 'user';
              setCamera(next);
              persist(SETTINGS_KEYS.camera, next);
            }}
          >
            <Text style={styles.value}>{camera === 'user' ? 'Front' : 'Rear'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.clear} onPress={clearLocal}>
          <Text style={styles.clearText}>Clear local data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 211, 153, 0.2)',
    backgroundColor: '#1E293B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#F1F5F9' },
  placeholder: { width: 40 },
  content: { padding: 20, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: { color: '#F1F5F9', fontSize: 16 },
  value: { color: '#10B981', fontWeight: '600' },
  clear: { marginTop: 24, alignItems: 'center', padding: 14 },
  clearText: { color: '#F87171', fontWeight: '600' },
});
