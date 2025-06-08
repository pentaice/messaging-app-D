import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { formatTimestamp, getFileType, formatFileSize } from '../utils/helpers';
import Message from '../components/Message';
import { Video } from 'expo-av';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const { currentUser, loading: authLoading } = useContext(AuthContext);
  const { messages, sendMessage, deleteMessage, activeChat, setActiveChat, conversations, socket } = useContext(ChatContext);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const currentConversation = conversations.find(conv => conv.id === conversationId);
  const otherParticipantId = currentConversation?.participants.find(userCode => userCode !== currentUser?.userCode);
  
  const otherParticipantDetails = (currentConversation?.participantDetails && otherParticipantId) ? currentConversation.participantDetails[otherParticipantId] : 
                                (currentConversation?.participants || []).find(p => p === otherParticipantId || p.userCode === otherParticipantId);

  const otherUserName = currentConversation?.userName || otherParticipantDetails?.name || otherParticipantDetails?.userCode || otherParticipantId || 'Bilinmeyen Kullanıcı';

  useEffect(() => {
    if (conversationId) {
      setActiveChat(conversationId);
      navigation.setOptions({
        title: `Kullanıcı: ${otherUserName}`,
      });
      
      if (socket && conversationId) {
        socket.emit('joinConversation', conversationId);
        console.log(`Odaya katılma isteği gönderildi: ${conversationId}`);
        socket.emit('getMessages', { conversationId: conversationId });
        console.log(`Mesajlar isteniyor: ${conversationId}`);
      }

      return () => {
        setActiveChat(null);
      };
    } else {
      Alert.alert('Hata', 'Sohbet bilgisi bulunamadı');
      navigation.goBack();
    }
  }, [conversationId, conversations, currentUser, otherUserName, navigation, socket]);

  if (authLoading || !currentUser || !conversations) {
     return (
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#6C63FF" />
         <Text style={styles.loadingText}>Yükleniyor...</Text>
       </View>
     );
  }

  const handleSend = async () => {
    if (inputMessage.trim()) {
      try {
        setIsLoading(true);
        await sendMessage(conversationId, inputMessage.trim());
        setInputMessage('');
      } catch (error) {
        Alert.alert('Hata', error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      const info = await FileSystem.getInfoAsync(uri);
      const audioFile = {
        uri,
        type: 'audio/m4a',
        name: `audio_${Date.now()}.m4a`,
        size: info.size
      };

      await sendMessage(conversationId, 'Sesli mesaj', 'audio', audioFile);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }

    setRecording(null);
    setIsRecording(false);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const type = asset.type === 'video' ? 'video' : 'image';
        
        const file = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: `${type}_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          size: asset.fileSize
        };

        await sendMessage(conversationId, `${type === 'video' ? 'Video' : 'Resim'} gönderildi`, type, file);
      }
    } catch (error) {
      console.error('Failed to pick image', error);
    }
    setShowAttachmentModal(false);
  };

  const filteredMessages = React.useMemo(() => {
    console.log('Tüm mesajlar:', messages);
    if (!Array.isArray(messages)) {
      console.error('Mesajlar bir dizi değil:', messages);
      return [];
    }
    const filtered = messages.filter(message => {
      console.log('Mesaj kontrol ediliyor:', message);
      return message && message.conversationId === conversationId;
    });
    console.log('Filtrelenmiş mesajlar:', filtered);
    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateA - dateB;
    });
  }, [messages, conversationId]);

  const renderMessage = ({ item }) => {
    console.log('Mesaj render ediliyor:', item);
    if (!item) {
      console.error('Geçersiz mesaj:', item);
      return null;
    }

    const isOwnMessage = item.senderUserCode === currentUser?.userCode;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {item.type === 'image' && (
          <Image
            source={{ uri: item.fileUrl }}
            style={styles.messageImage}
            resizeMode="cover"
            tintColor={styles.messageImage.tintColor}
          />
        )}
        
        {item.type === 'video' && (
          <View style={styles.videoContainer}>
            <Ionicons name="play-circle" size={40} color="#FFFFFF" />
          </View>
        )}
        
        {item.type === 'audio' && (
          <TouchableOpacity style={styles.audioContainer}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <View style={styles.audioProgressBar} />
          </TouchableOpacity>
        )}
        
        {item.type === 'text' && (
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        )}

        <Text style={styles.messageTime}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="light" />
      
      <FlatList
        ref={flatListRef}
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setShowAttachmentModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor="#666"
          multiline
        />

        {isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={stopRecording}
          >
            <Ionicons name="stop" size={24} color="#FF4444" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
          >
            <Ionicons name="mic" size={24} color="#6C63FF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputMessage.trim() || isLoading}
        >
          <Ionicons name="send" size={24} color={inputMessage.trim() ? "#6C63FF" : "#666"} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleImagePick}
            >
              <Ionicons name="image" size={24} color="#6C63FF" />
              <Text style={styles.modalButtonText}>Resim/Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAttachmentModal(false)}
            >
              <Ionicons name="close" size={24} color="#FF4444" />
              <Text style={styles.modalButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  videoContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  audioProgressBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  recordButton: {
    padding: 8,
  },
  attachmentButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
});

export default ChatScreen;
