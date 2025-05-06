import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Ekranlar
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E1E1E',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      {!currentUser ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Sohbetler',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params.userName || `Kullanıcı: ${route.params.userId}`,
            })}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profil',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default AppNavigator;
