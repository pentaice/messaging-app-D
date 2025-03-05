// Klasör Yapısı
/*
/src
  /components
    /UI
      Button.js
      Input.js
      Modal.js
    /Chat
      MessageItem.js
      ChatHeader.js
      MediaPicker.js
  /screens
    AuthScreen.js
    HomeScreen.js
    ChatScreen.js
    ProfileScreen.js
  /navigation
    AppNavigator.js
  /services
    firebaseService.js
    authService.js
    chatService.js
    storageService.js
  /utils
    helpers.js
    constants.js
  /context
    AuthContext.js
    ChatContext.js
  App.js
*/

// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}