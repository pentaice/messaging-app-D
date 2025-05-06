import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { currentUser, logout, updateUserProfile } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              });
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            // Hesap silme işlemi eklenecek
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {currentUser?.displayName?.charAt(0) || currentUser?.userCode?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.userCode}>Kullanıcı Kodunuz: {currentUser?.userCode}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="person-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Profil Bilgileri</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="notifications-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Bildirimler</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#333333', true: '#6C63FF' }}
            thumbColor="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="moon-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Karanlık Mod</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#333333', true: '#6C63FF' }}
            thumbColor="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gizlilik</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Gizlilik Ayarları</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="shield-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Güvenlik</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diğer</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="help-circle-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Yardım</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Ionicons name="information-circle-outline" size={24} color="#6C63FF" />
            <Text style={styles.menuItemText}>Hakkında</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Hesabı Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userCode: {
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  buttonContainer: {
    padding: 15,
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#6C63FF',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;
