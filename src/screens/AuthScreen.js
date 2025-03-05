// AuthScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, anonymousLogin } = useContext(AuthContext);

  const handleAuth = async () => {
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  const handleAnonymousLogin = async () => {
    await anonymousLogin();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Gizli Mesajlaşma</Text>
        <Text style={styles.subtitle}>Güvenli ve Özel İletişim</Text>
      </View>

      <View style={styles.formContainer}>
        {!isLogin && (
          <Input
            placeholder="Kullanıcı Adı"
            onChangeText={(text) => setEmail(text)}
            value={email}
            autoCapitalize="none"
          />
        )}

        <Input
          placeholder={isLogin ? "Kullanıcı Kodu (6-8 karakter)" : "E-posta"}
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize="none"
          keyboardType={isLogin ? "default" : "email-address"}
        />

        {!isLogin && (
          <Input
            placeholder="Şifre"
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry
          />
        )}

        <Button title={isLogin ? "Giriş Yap" : "Kayıt Ol"} onPress={handleAuth} />
        
        {isLogin && (
          <Button 
            title="Hızlı Giriş (Anonim)" 
            onPress={handleAnonymousLogin} 
            type="secondary"
          />
        )}
      </View>

      <TouchableOpacity 
        onPress={() => setIsLogin(!isLogin)} 
        style={styles.toggleButton}
      >
        <Text style={styles.toggleText}>
          {isLogin 
            ? "Hesabınız yok mu? Kayıt olun" 
            : "Zaten hesabınız var mı? Giriş yapın"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBBBBB',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  toggleButton: {
    alignItems: 'center',
    padding: 10,
  },
  toggleText: {
    color: '#6C63FF',
    fontSize: 16,
  },
});

export default AuthScreen;