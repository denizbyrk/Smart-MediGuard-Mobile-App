import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, Alert,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { login } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💊 SmartMediGuard</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Sign In</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>No account yet? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title:      { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#2196F3', marginBottom: 8 },
  subtitle:   { fontSize: 20, textAlign: 'center', color: '#666', marginBottom: 32 },
  input:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16 },
  button:     { backgroundColor: '#2196F3', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link:       { textAlign: 'center', color: '#2196F3', fontSize: 16 },
});