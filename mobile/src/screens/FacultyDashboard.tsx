import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8000/api/v1';

export default function FacultyDashboard({ route, navigation }: any) {
  const { username } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery) {
      Alert.alert('Validation', 'Please enter a student name or ID.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await axios.get(`${API_URL}/students?search=${searchQuery.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.items || []);
      setSelectedStudent(null);
    } catch (e) {
      console.error(e);
      Alert.alert('Search Failed', 'Failed to retrieve students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (id: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await axios.get(`${API_URL}/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedStudent(response.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to retrieve student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Faculty Portal</Text>
        <Text style={styles.nameText}>{username || 'Instructor'}</Text>
      </View>

      {/* Student Lookup Tool */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Academic Lookup</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or ID..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={styles.loader} size="small" color="#38bdf8" />}

        {/* Results List */}
        {!selectedStudent && searchResults.length > 0 && (
          <View style={styles.resultsBox}>
            {searchResults.map((s) => (
              <TouchableOpacity key={s.id} style={styles.resultItem} onPress={() => fetchStudentDetails(s.id)}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentId}>{s.student_id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Student Detail Panel */}
      {selectedStudent && (
        <View style={styles.section}>
          <Text style={styles.detailTitle}>{selectedStudent.name}</Text>
          <Text style={styles.detailSubtitle}>Roll: {selectedStudent.student_id} | Sem: {selectedStudent.current_semester}</Text>
          
          <View style={styles.divider} />
          
          {selectedStudent.ml_features ? (
            <View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Current CGPA:</Text>
                <Text style={styles.statVal}>{parseFloat(selectedStudent.ml_features.current_cgpa).toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Attendance:</Text>
                <Text style={styles.statVal}>{parseFloat(selectedStudent.ml_features.avg_attendance).toFixed(1)}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Backlogs:</Text>
                <Text style={[styles.statVal, { color: selectedStudent.ml_features.total_backlogs > 0 ? '#ef4444' : '#ffffff' }]}>
                  {selectedStudent.ml_features.total_backlogs}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.subHeading}>AI Predictor Indicators</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Academic Risk:</Text>
                <Text style={[styles.statVal, { color: selectedStudent.ml_features.risk_score >= 0.6 ? '#ef4444' : '#eab308' }]}>
                  {Math.round(selectedStudent.ml_features.risk_score * 100)}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Placement Prob:</Text>
                <Text style={[styles.statVal, { color: '#22c55e' }]}>
                  {Math.round(selectedStudent.ml_features.placement_probability * 100)}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noFeatures}>No predictive data available for this student.</Text>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedStudent(null)}>
            <Text style={styles.closeButtonText}>Close Profile</Text>
          </TouchableOpacity>
        </View>
      )}

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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 0.72,
    backgroundColor: '#334155',
    color: '#ffffff',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  searchButton: {
    flex: 0.25,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loader: {
    marginTop: 12,
  },
  resultsBox: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  studentName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  studentId: {
    color: '#94a3b8',
    fontSize: 13,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 15,
    color: '#94a3b8',
  },
  statVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
  },
  noFeatures: {
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: '#475569',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
