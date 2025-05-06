import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

// Web için gerekli stil ayarları
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      background-color: #121212;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ChatProvider>
    </AuthProvider>
  );
} 