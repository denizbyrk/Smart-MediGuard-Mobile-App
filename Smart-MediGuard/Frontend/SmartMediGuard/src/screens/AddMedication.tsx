import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
// ... rest of your imports remain the same
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { addMedication } from '../services/medicationService';
import { scheduleMedicationNotifications } from '../services/notificationService';
import { syncWithServer } from '../services/syncService';

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every other day',
  'As needed',
];

const SCAN_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5199/api/chat/scan-prescription' 
  : 'http://localhost:5199/api/chat/scan-prescription';

export default function AddMedication() {
  const router = useRouter();

  const [name, setName]               = useState('');
  const [dosage, setDosage]           = useState('');
  const [frequency, setFrequency]     = useState('Once daily');
  const [time, setTime]               = useState('');
  const [quantity, setQuantity]       = useState('');
  const [reminder, setReminder]       = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [scanning, setScanning]       = useState(false); 

  const handleScanPrescription = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera access to scan prescriptions.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6, 
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    setScanning(true);
    
    try {
      const imageUri = result.assets[0].uri;
      
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64'
      });
      
      const response = await fetch(SCAN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      if (!response.ok) {
        throw new Error('AI interpretation endpoint failed.');
      }

      const data = await response.json();
      
      if (data) {
        if (data.name) setName(data.name);
        if (data.dosage) setDosage(data.dosage.toString());
        if (data.frequency) {
          const matchedFreq = FREQUENCY_OPTIONS.find(f => f.toLowerCase() === data.frequency.toLowerCase());
          if (matchedFreq) setFrequency(matchedFreq);
        }
        if (data.time) setTime(data.time);
        if (data.quantity) setQuantity(data.quantity.toString());
        
        Alert.alert('AI Scan Complete', 'Form values successfully extracted!');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Scan Failed', 'AI could not read the image clearly. Please enter values manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Medication name is required.');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      const timeSlots = time.trim() ? [time.trim()] : [];
      const newId = await addMedication({
        user_id:      parseInt(userId ?? '1'),
        name:         name.trim(),
        dosage:       dosage.trim() || null,
        frequency,
        time_slots:   timeSlots,
        stock_count:  quantity ? parseInt(quantity) : 0,
        instructions: null,
      });
      if (reminder && timeSlots.length > 0) {
        scheduleMedicationNotifications({
          id: newId, name: name.trim(), dosage: dosage.trim(), time_slots: timeSlots,
        }).catch(() => {});
      }
      syncWithServer().catch(() => {}); 
      Alert.alert('Success', 'Medication saved!', [
        { text: 'OK', onPress: () => router.push('/medications' as any) },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save medication.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/medications' as any)}>
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Scan Prescription Button */}
          <TouchableOpacity 
            style={[styles.scanCard, scanning && { opacity: 0.7 }]} 
            onPress={handleScanPrescription}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="camera-outline" size={30} color="#fff" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.scanText}>
              {scanning ? "Analyzing via AI Vision..." : "📸 Scan Prescription with AI"}
            </Text>
          </TouchableOpacity>

          {/* Divider Layout (Fixed/Closed Properly Below) */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Medication Name */}
          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter medication name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          {/* Dosage */}
          <Text style={styles.label}>Dosage (mg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dosage"
            placeholderTextColor="#9CA3AF"
            value={dosage}
            onChangeText={setDosage}
            keyboardType="numeric"
          />

          {/* Frequency */}
          <Text style={styles.label}>Frequency</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setPickerVisible(true)}>
            <Text style={styles.pickerText}>{frequency}</Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Time */}
          <Text style={styles.label}>Time (e.g. 08:00 AM)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter time"
            placeholderTextColor="#9CA3AF"
            value={time}
            onChangeText={setTime}
          />

          {/* Quantity */}
          <Text style={styles.label}>Quantity (pills)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            placeholderTextColor="#9CA3AF"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          {/* Reminder Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Set Reminder</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: '#D1D5DB', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Medication</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Frequency Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Frequency</Text>
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => { setFrequency(opt); setPickerVisible(false); }}
              >
                <Text style={[styles.modalOptionText, opt === frequency && styles.modalOptionActive]}>
                  {opt}
                </Text>
                {opt === frequency && (
                  <Ionicons name="checkmark" size={20} color="#2D8659" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#2D8659', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 52, paddingBottom: 20 },
  backButton: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  scanCard: { backgroundColor: '#2D8659', borderRadius: 16, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#2D8659', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  scanText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { fontSize: 16, color: '#9CA3AF', paddingHorizontal: 12 },
  label: { fontSize: 17, color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, fontSize: 17, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  picker: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  pickerText: { fontSize: 17, color: '#111827' },
  toggleRow: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  toggleLabel: { fontSize: 17, color: '#111827' },
  saveButton: { backgroundColor: '#2D8659', borderRadius: 12, paddingVertical: 18, alignItems: 'center', shadowColor: '#2D8659', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 17, color: '#374151' },
  modalOptionActive: { color: '#2D8659', fontWeight: '600' },
  modalCancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 17, color: '#EF5350', fontWeight: '500' },
});