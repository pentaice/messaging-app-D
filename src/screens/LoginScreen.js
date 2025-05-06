import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={80} color="#6C63FF" />
            <Text style={styles.title}>Gizli Mesajlaşma</Text>
            <Text style={styles.subtitle}>
              Güvenli ve özel mesajlaşma deneyimi için hoş geldiniz
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={24} color="#6C63FF" />
              <Text style={styles.featureTitle}>Güvenli İletişim</Text>
              <Text style={styles.featureText}>
                Mesajlarınız uçtan uca şifreleme ile korunur
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="timer" size={24} color="#6C63FF" />
              <Text style={styles.featureTitle}>Geçici Mesajlar</Text>
              <Text style={styles.featureText}>
                Mesajlarınız belirlediğiniz süre sonunda otomatik silinir
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="person" size={24} color="#6C63FF" />
              <Text style={styles.featureTitle}>Anonim Kimlik</Text>
              <Text style={styles.featureText}>
                Benzersiz kodunuzla anonim olarak mesajlaşın
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Hemen Başla</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Devam ederek, Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#BBBBBB',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: width * 0.8,
  },
  featuresContainer: {
    width: '100%',
    marginVertical: 40,
  },
  featureItem: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  featureText: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disclaimer: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LoginScreen; 