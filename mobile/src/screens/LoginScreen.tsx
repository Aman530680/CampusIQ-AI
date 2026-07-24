import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Update with host IP or fallback
const API_URL = 'http://10.0.2.2:8000/api/v1'; // standard Android emulator loopback IP

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: username.trim(),
        password: password
      });

      const { access_token, role, user_id } = response.data;
      
      await AsyncStorage.setItem('user_token', access_token);
      await AsyncStorage.setItem('user_role', role);
      await AsyncStorage.setItem('user_id', user_id.toString());
      await AsyncStorage.setItem('username', username.trim());

      Alert.alert('Success', 'Login successful!');
      
      if (role === 'student') {
        navigation.replace('StudentDashboard', { userId: user_id, username });
      } else {
        navigation.replace('FacultyDashboard', { userId: user_id, username });
      }
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail || 'Invalid username or password';
      Alert.alert('Authentication Failed', detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>CampusIQ AI</Text>
        <Text style={styles.subtitle}>Academic Intelligence Platform</Text>

        <TextInput
          style={styles.input}
          placeholder="Username (e.g. stu00001 / faculty1)"
          placeholderTextColor="#9ca3af"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#334155',
    color: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
