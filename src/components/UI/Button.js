import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  loading = false, 
  disabled = false,
  variant = 'primary' // primary, secondary, outline
}) => {
  const getButtonStyle = () => {
    if (disabled) return styles.disabledButton;
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
  },
  secondaryButton: {
    backgroundColor: '#2A2A2A',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  disabledButton: {
    backgroundColor: '#444444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#888888',
  },
});

export default Button;
