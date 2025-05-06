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

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const { currentUser } = useContext(AuthContext);
  const { messages, sendMessage, deleteMessage, activeChat, setActiveChat } = useContext(ChatContext);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      setActiveChat(conversationId);
      return () => setActiveChat(null);
    } else {
      Alert.alert('Hata', 'Sohbet bilgisi bulunamadı');
      navigation.goBack();
    }
  }, [conversationId]);

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

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === currentUser.uid;

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
          <Text style={styles.messageText}>{item.content}</Text>
        )}
        
        <Text style={styles.timestamp}>
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
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={() => setShowAttachmentModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor="#888888"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
        />

        {inputMessage.trim() ? (
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
          >
            <Ionicons name="send" size={24} color="#6C63FF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Ionicons 
              name={isRecording ? "radio-button-on" : "mic-outline"} 
              size={24} 
              color={isRecording ? "#FF4444" : "#6C63FF"} 
            />
          </TouchableOpacity>
        )}
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
              style={styles.modalOption}
              onPress={handleImagePick}
            >
              <Ionicons name="image-outline" size={32} color="#6C63FF" />
              <Text style={styles.modalOptionText}>Galeri</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                // Kamera fonksiyonu eklenecek
                setShowAttachmentModal(false);
              }}
            >
              <Ionicons name="camera-outline" size={32} color="#6C63FF" />
              <Text style={styles.modalOptionText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAttachmentModal(false)}
            >
              <Text style={styles.modalCloseText}>İptal</Text>
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
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  videoContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 10,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 20,
    width: 150,
  },
  audioProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: 10,
    borderRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E1E1E',
  },
  attachButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
  },
  micButton: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  modalCloseText: {
    color: '#FF4444',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
