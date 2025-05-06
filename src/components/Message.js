import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '../utils/helpers';

const { width } = Dimensions.get('window');

const Message = ({ 
  message, 
  isOwnMessage, 
  onDelete,
  onMediaPress 
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleLongPress = () => {
    setShowOptions(true);
  };

  const handleDelete = () => {
    setShowOptions(false);
    onDelete(message.id);
  };

  const renderMedia = () => {
    switch (message.type) {
      case 'image':
        return (
          <TouchableOpacity 
            onPress={() => setShowImageModal(true)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.fileUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      
      case 'video':
        return (
          <TouchableOpacity 
            style={styles.videoContainer}
            onPress={() => onMediaPress(message)}
          >
            {message.thumbnailUrl && (
              <Image
                source={{ uri: message.thumbnailUrl }}
                style={styles.videoThumbnail}
              />
            )}
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        );
      
      case 'audio':
        return (
          <TouchableOpacity 
            style={styles.audioContainer}
            onPress={() => onMediaPress(message)}
          >
            <Ionicons name="musical-note" size={24} color="#FFFFFF" />
            <View style={styles.audioInfo}>
              <Text style={styles.audioText}>Sesli Mesaj</Text>
              <Text style={styles.audioDuration}>{message.duration || '0:00'}</Text>
            </View>
          </TouchableOpacity>
        );
      
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      {renderMedia()}
      
      {message.type === 'text' && (
        <Text style={styles.messageText}>{message.content}</Text>
      )}
      
      <Text style={styles.timestamp}>
        {formatTimestamp(message.timestamp)}
      </Text>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            {isOwnMessage && (
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#FF4444" />
                <Text style={[styles.optionText, { color: '#FF4444' }]}>
                  Mesajı Sil
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowOptions(false)}
            >
              <Ionicons name="close-outline" size={24} color="#FFFFFF" />
              <Text style={styles.optionText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: message.fileUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: width * 0.8,
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
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  audioInfo: {
    marginLeft: 10,
  },
  audioText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  audioDuration: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default Message; 