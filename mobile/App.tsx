import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import StudentDashboard from './src/screens/StudentDashboard';
import FacultyDashboard from './src/screens/FacultyDashboard';

export type RootStackParamList = {
  Login: undefined;
  StudentDashboard: { userId: number; username: string };
  FacultyDashboard: { userId: number; username: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    // Check if token exists
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        const role = await AsyncStorage.getItem('user_role');
        const id = await AsyncStorage.getItem('user_id');
        const username = await AsyncStorage.getItem('username');

        if (token && role && id && username) {
          setUserRole(role);
          setUserData({ id: parseInt(id), username });
        }
      } catch (e) {
        console.error('Failed to load auth status:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return null; // Standard splash loader could be placed here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userRole ? (
          userRole === 'student' ? (
            <Stack.Screen 
              name="StudentDashboard" 
              component={StudentDashboard} 
              initialParams={userData || undefined}
            />
          ) : (
            <Stack.Screen 
              name="FacultyDashboard" 
              component={FacultyDashboard} 
              initialParams={userData || undefined}
            />
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
