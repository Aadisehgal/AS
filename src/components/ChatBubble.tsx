import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {Message} from '../types';
import {getEmotionLabel} from '../utils/emotion';

interface ChatBubbleProps {
  message: Message;
  assistantName: string;
  userName: string;
  language: string;
}

export function ChatBubble({message, assistantName, userName, language}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const emotionLabel = message.emotion ? getEmotionLabel(message.emotion, language) : null;

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={styles.name}>
          {isUser ? userName : assistantName}
        </Text>
        <Text style={[styles.content, isUser ? styles.userContent : styles.assistantContent]}>
          {message.content}
        </Text>
        {emotionLabel && (
          <Text style={styles.emotionTag}>{emotionLabel}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4ECDC4',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2d2d44',
    borderBottomLeftRadius: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#888',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  userContent: {
    color: '#fff',
  },
  assistantContent: {
    color: '#e0e0e0',
  },
  emotionTag: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
