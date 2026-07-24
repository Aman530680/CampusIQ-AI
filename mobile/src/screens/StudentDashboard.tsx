import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8000/api/v1';

export default function StudentDashboard({ route, navigation }: any) {
  const { username } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const storedId = await AsyncStorage.getItem('user_id');

      // Fetch student details from API
      // First get list of all students to find match by username
      const listRes = await axios.get(`${API_URL}/students?search=${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (listRes.data.items && listRes.data.items.length > 0) {
        const student = listRes.data.items[0];
        
        // Fetch detailed profile (which includes ML features)
        const detailRes = await axios.get(`${API_URL}/students/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudentData(detailRes.data);
      } else {
        Alert.alert('Error', 'Student record not found.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Failed to retrieve profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Fetching Academic Records...</Text>
      </View>
    );
  }

  const features = studentData?.ml_features || {};
  const placementProb = features.placement_probability ? Math.round(features.placement_probability * 100) : 0;
  const riskProb = features.risk_score ? Math.round(features.risk_score * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.nameText}>{studentData?.name || 'Student'}</Text>
        <Text style={styles.idText}>ID: {studentData?.student_id}</Text>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>CGPA</Text>
          <Text style={styles.metricValue}>{features.current_cgpa ? parseFloat(features.current_cgpa).toFixed(2) : 'N/A'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Attendance</Text>
          <Text style={styles.metricValue}>{features.avg_attendance ? parseFloat(features.avg_attendance).toFixed(1) : 'N/A'}%</Text>
        </View>
      </View>

      {/* Predictor Dashboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Academic Insights</Text>
        
        <View style={styles.insightRow}>
          <View style={styles.insightBox}>
            <Text style={styles.insightLabel}>Placement Probability</Text>
            <Text style={[styles.insightVal, { color: '#22c55e' }]}>{placementProb}%</Text>
          </View>
          <View style={styles.insightBox}>
            <Text style={styles.insightLabel}>Academic Risk</Text>
            <Text style={[styles.insightVal, { color: riskProb > 50 ? '#ef4444' : '#eab308' }]}>
              {riskProb}%
            </Text>
          </View>
        </View>
      </View>

      {/* Advisor Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advisor Recommendations</Text>
        <View style={styles.recsBox}>
          {features.avg_attendance < 75 && (
            <Text style={styles.recText}>• Attendance is below 75%. Attend remaining classes to avoid semester backlog.</Text>
          )}
          {features.total_backlogs > 0 && (
            <Text style={styles.recText}>• Clear existing {features.total_backlogs} backlogs before entering placements.</Text>
          )}
          {placementProb < 50 && (
            <Text style={styles.recText}>• Engage in coding practice and mock interviews to improve placement potential.</Text>
          )}
          {features.avg_attendance >= 75 && features.total_backlogs === 0 && placementProb >= 50 && (
            <Text style={styles.recText}>• Outstanding performance! Keep up the excellent work to maintain your metrics.</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginVertical: 4,
  },
  idText: {
    fontSize: 14,
    color: '#64748b',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 0.48,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightBox: {
    flex: 0.48,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
  },
  insightLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    textAlign: 'center',
  },
  insightVal: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  recsBox: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  recText: {
    fontSize: 14,
    color: '#f8fafc',
    marginBottom: 8,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
