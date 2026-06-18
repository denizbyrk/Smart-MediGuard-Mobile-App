import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { BottomNav } from '../components/BottomNav';
import { deleteAccount, logout, updateProfile } from '../services/authService';
import { getMedications } from '../services/medicationService';

export default function ProfileSettings() {
  const router = useRouter();

  const [userName, setUserName]   = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [editName, setEditName]   = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [medCount, setMedCount]   = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [remindersOn, setRemindersOn]  = useState(true);
  const [refillOn, setRefillOn]        = useState(true);
  const [summaryOn, setSummaryOn]      = useState(false);
  const [soundOn, setSoundOn]          = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const name   = await AsyncStorage.getItem('userName');
      const email  = await AsyncStorage.getItem('userEmail');
      const userId = await AsyncStorage.getItem('userId');
      setUserName(name ?? '');
      setEditName(name ?? '');
      setUserEmail(email ?? '');
      if (userId) {
        const meds = await getMedications(parseInt(userId));
        setMedCount(meds.length);
      }
    } catch {}
  };

  const initials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      await updateProfile(editName.trim());
      setUserName(editName.trim());
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profil güncellendi.');
    } catch {
      Alert.alert('Hata', 'Profil güncellenemedi.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login' as any);
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/login' as any);
          } catch {
            Alert.alert('Hata', 'Hesap silinemedi.');
          }
        }},
      ]
    );
  };

  const toggle = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home' as any)}>
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName || 'User'}</Text>
            {userEmail ? <Text style={styles.profileEmail}>{userEmail}</Text> : null}
            <Text style={styles.profileMeds}>{medCount} Active Medication{medCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('personal')} activeOpacity={0.7}>
            <View style={[styles.sectionIcon, { backgroundColor: '#2D865920' }]}>
              <Ionicons name="person-outline" size={24} color="#2D8659" />
            </View>
            <Text style={styles.sectionLabel}>Personal Information</Text>
            <Ionicons name={expandedSection === 'personal' ? 'chevron-down' : 'chevron-forward'} size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {expandedSection === 'personal' && (
            <View style={styles.expandedCard}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.fieldValueRow}>
                    <Text style={styles.fieldValue}>{userName || 'Not set'}</Text>
                    <Ionicons name="pencil-outline" size={16} color="#9CA3AF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                )}
              </View>
              {isEditing && (
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditName(userName); setIsEditing(false); }}>
                    <Text style={styles.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.fieldRow, styles.fieldBorder]}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{userEmail || 'Not set'}</Text>
              </View>
              <View style={[styles.fieldRow, styles.fieldBorder]}>
                <Text style={styles.fieldLabel}>Active Medications</Text>
                <Text style={styles.fieldValue}>{medCount}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('notifications')} activeOpacity={0.7}>
            <View style={[styles.sectionIcon, { backgroundColor: '#4A90E220' }]}>
              <Ionicons name="notifications-outline" size={24} color="#4A90E2" />
            </View>
            <Text style={styles.sectionLabel}>Notification Settings</Text>
            <Ionicons name={expandedSection === 'notifications' ? 'chevron-down' : 'chevron-forward'} size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {expandedSection === 'notifications' && (
            <View style={styles.expandedCard}>
              {[
                { label: 'Medication Reminders', value: remindersOn, setter: setRemindersOn },
                { label: 'Refill Alerts',        value: refillOn,    setter: setRefillOn },
                { label: 'Daily Summary',        value: summaryOn,   setter: setSummaryOn },
                { label: 'Sound',                value: soundOn,     setter: setSoundOn },
              ].map((item, idx, arr) => (
                <View key={item.label} style={[styles.switchRow, idx < arr.length - 1 && styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>{item.label}</Text>
                  <Switch
                    value={item.value}
                    onValueChange={item.setter}
                    trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('privacy')} activeOpacity={0.7}>
            <View style={[styles.sectionIcon, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="lock-closed-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.sectionLabel}>Privacy & Security</Text>
            <Ionicons name={expandedSection === 'privacy' ? 'chevron-down' : 'chevron-forward'} size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {expandedSection === 'privacy' && (
            <View style={styles.expandedCard}>
              {[
                { label: 'Face ID',         value: 'Enabled'  },
                { label: 'PIN Lock',        value: 'Enabled'  },
                { label: 'Data Sharing',    value: 'Disabled' },
                { label: 'Two-Factor Auth', value: 'Enabled'  },
              ].map((item, idx, arr) => (
                <View key={item.label} style={[styles.fieldRow, idx < arr.length - 1 && styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>{item.label}</Text>
                  <Text style={[styles.fieldValue, { color: '#4CAF50' }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('sync')} activeOpacity={0.7}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFC10720' }]}>
              <Ionicons name="cloud-outline" size={24} color="#FFC107" />
            </View>
            <Text style={styles.sectionLabel}>Sync & Backup</Text>
            <Ionicons name={expandedSection === 'sync' ? 'chevron-down' : 'chevron-forward'} size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {expandedSection === 'sync' && (
            <View style={styles.expandedCard}>
              {[
                { label: 'Cloud Backup', value: 'Enabled' },
                { label: 'Auto Sync', value: 'Enabled' },
                { label: 'Storage Used', value: '2.3 MB' },
              ].map((item, idx, arr) => (
                <View key={item.label} style={[styles.fieldRow, idx < arr.length - 1 && styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>{item.label}</Text>
                  <Text style={[styles.fieldValue, { color: '#FFC107' }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('about')} activeOpacity={0.7}>
            <View style={[styles.sectionIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="information-circle-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.sectionLabel}>About & Help</Text>
            <Ionicons name={expandedSection === 'about' ? 'chevron-down' : 'chevron-forward'} size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {expandedSection === 'about' && (
            <View style={styles.expandedCard}>
              {[
                { label: 'Version', value: '1.0.0' },
                { label: 'Contact Support', value: 'support@mediguard.com' },
              ].map((item, idx, arr) => (
                <View key={item.label} style={[styles.fieldRow, idx < arr.length - 1 && styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>{item.label}</Text>
                  <Text style={[styles.fieldValue, { color: '#9C27B0' }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color="#EF5350" />
          </View>
          <Text style={styles.logoutLabel}>Logout</Text>
          <Ionicons name="chevron-forward" size={22} color="#EF5350" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <View style={styles.deleteIcon}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.deleteLabel}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Smart MediGuard v1.0.0</Text>
          <Text style={styles.footerSub}>© 2025 All rights reserved</Text>
        </View>
      </ScrollView>

      <BottomNav currentScreen="profile" />
      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F5F7FA' },
  header:          { backgroundColor: '#2D8659', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20 },
  backButton:      { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 24, color: '#fff', fontWeight: '600' },
  scrollContent:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110, gap: 12 },
  profileCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  avatar:          { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2D8659', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText:      { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileInfo:     { flex: 1 },
  profileName:     { fontSize: 22, fontWeight: '600', color: '#111827', marginBottom: 4 },
  profileEmail:    { fontSize: 16, color: '#6B7280', marginBottom: 4 },
  profileMeds:     { fontSize: 15, color: '#4A90E2', fontWeight: '500' },
  section:         { gap: 6 },
  sectionHeader:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 70, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionIcon:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  sectionLabel:    { flex: 1, fontSize: 17, color: '#111827' },
  expandedCard:    { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  fieldRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  fieldBorder:     { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  fieldLabel:      { fontSize: 15, color: '#6B7280', flex: 1 },
  fieldValue:      { fontSize: 15, fontWeight: '600', color: '#111827' },
  fieldValueRow:   { flexDirection: 'row', alignItems: 'center' },
  fieldInput:      { fontSize: 15, fontWeight: '600', color: '#111827', borderBottomWidth: 1, borderBottomColor: '#2D8659', minWidth: 150, textAlign: 'right', paddingVertical: 2 },
  editButtons:     { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingBottom: 12 },
  saveBtn:         { backgroundColor: '#2D8659', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn:       { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  cancelBtnText:   { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  switchRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  logoutRow:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 70, borderWidth: 2, borderColor: '#FECDD3', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  logoutIcon:      { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  logoutLabel:     { flex: 1, fontSize: 17, color: '#EF5350', fontWeight: '500' },
  deleteRow:       { backgroundColor: '#EF5350', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 70, shadowColor: '#EF5350', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  deleteIcon:      { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  deleteLabel:     { flex: 1, fontSize: 17, color: '#fff', fontWeight: '600' },
  footer:          { alignItems: 'center', paddingVertical: 8 },
  footerText:      { fontSize: 15, color: '#9CA3AF' },
  footerSub:       { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
});
