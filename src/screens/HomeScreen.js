// HomeScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import Button from '../components/UI/Button';
import { formatTimestamp } from '../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const chatContext = useContext(ChatContext);
  const conversations = chatContext?.conversations || [];
  const startConversation = chatContext?.startConversation;
  const [modalVisible, setModalVisible] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [messageMode, setMessageMode] = useState('permanent');

  useEffect(() => {
    // Kullanıcı kodunu ekranın başlığına ekle
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.userCodeText}>Kodunuz: {currentUser?.userCode || 'Yükleniyor...'}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.profileButton}
          >
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentUser]);

  const handleStartConversation = async () => {
    if (userCode.length >= 6) {
      try {
        const conversationId = await startConversation(userCode, messageMode);
        setModalVisible(false);
        setUserCode('');
        navigation.navigate('Chat', { conversationId });
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const renderConversationItem = ({ item }) => {
    // Güvenli bir şekilde userId ve userName değerlerini al
    const userId = item.userId || '';
    const userName = item.userName || '';
    const firstChar = userName ? userName.charAt(0) : (userId ? userId.charAt(0) : '?');
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{firstChar}</Text>
        </View>
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{userName || (userId ? userId.substring(0, 8) : 'Bilinmeyen Kullanıcı')}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageTime)}</Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'Yeni bir sohbet başlat'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.messageTypeContainer}>
            <Ionicons 
              name={item.messageMode === 'temporary' ? 'timer-outline' : 'lock-closed-outline'} 
              size={14} 
              color="#6C63FF" 
            />
            <Text style={styles.messageType}>
              {item.messageMode === 'temporary' ? 'Geçici Mesajlar' : 'Kalıcı Mesajlar'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {(conversations && conversations.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color="#6C63FF" />
          <Text style={styles.emptyTitle}>Henüz Sohbet Yok</Text>
          <Text style={styles.emptyText}>
            Yeni bir kullanıcı kodu girerek gizli mesajlaşmaya başlayın
          </Text>
          <Button 
            title="Yeni Sohbet" 
            onPress={() => setModalVisible(true)} 
            style={styles.newChatButton}
          />
        </View>
      ) : (
        <FlatList
          data={conversations || []}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Sohbet Başlat</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Kullanıcı Kodu (6-8 karakter)"
              placeholderTextColor="#888888"
              value={userCode}
              onChangeText={setUserCode}
              maxLength={8}
            />
            
            <View style={styles.messageTypeSelector}>
              <Text style={styles.messageModeTitle}>Mesaj Saklama Modu:</Text>
              
              <View style={styles.messageTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.messageTypeOption,
                    messageMode === 'permanent' && styles.messageTypeOptionActive
                  ]}
                  onPress={() => setMessageMode('permanent')}
                >
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={messageMode === 'permanent' ? '#FFFFFF' : '#6C63FF'} 
                  />
                  <Text 
                    style={[
                      styles.messageTypeText,
                      messageMode === 'permanent' && styles.messageTypeTextActive
                    ]}
                  >
                    Kalıcı
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.messageTypeOption,
                    messageMode === 'temporary' && styles.messageTypeOptionActive
                  ]}
                  onPress={() => setMessageMode('temporary')}
                >
                  <Ionicons 
                    name="timer-outline" 
                    size={20} 
                    color={messageMode === 'temporary' ? '#FFFFFF' : '#6C63FF'} 
                  />
                  <Text 
                    style={[
                      styles.messageTypeText,
                      messageMode === 'temporary' && styles.messageTypeTextActive
                    ]}
                  >
                    Geçici
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Button title="Sohbet Başlat" onPress={handleStartConversation} />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCodeText: {
    color: '#FFFFFF',
    marginRight: 10,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  profileButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#BBBBBB',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  messageType: {
    color: '#6C63FF',
    fontSize: 12,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#BBBBBB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  newChatButton: {
    width: '70%',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  messageTypeSelector: {
    width: '100%',
    marginBottom: 20,
  },
  messageModeTitle: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 10,
  },
  messageTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C63FF',
    width: '48%',
    justifyContent: 'center',
  },
  messageTypeOptionActive: {
    backgroundColor: '#6C63FF',
  },
  messageTypeText: {
    color: '#6C63FF',
    marginLeft: 5,
    fontSize: 16,
  },
  messageTypeTextActive: {
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
  },
  closeButtonText: {
    color: '#888888',
    fontSize: 16,
  },
});

export default HomeScreen;
