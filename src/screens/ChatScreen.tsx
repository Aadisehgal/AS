import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useStore} from '../store/useStore';
import {useChat} from '../hooks/useChat';
import {useVoiceControl} from '../hooks/useVoiceControl';
import {ChatBubble} from '../components/ChatBubble';
import {VoiceIndicator} from '../components/VoiceIndicator';
import {BannerAdComponent} from '../components/BannerAdComponent';
import {Avatar3D} from '../components/Avatar3D';
import {showInterstitialWithCooldown} from '../services/ads';

export function ChatScreen() {
  const navigation = useNavigation();
  const {settings, messages, isListening} = useStore();
  const {isLoading, streamingText, sendMessage, stopChat} = useChat();
  const {startListening, stopListening} = useVoiceControl();
  const [inputText, setInputText] = React.useState('');
  const flatListRef = useRef<FlatList>(null);

  // Show interstitial ad when entering ChatScreen
  useEffect(() => {
    showInterstitialWithCooldown().catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({animated: true});
    }
  }, [messages, streamingText]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleVoicePress = () => {
    if (isListening) stopListening();
    else startListening(true);
  };

  const handleStopChat = () => {
    stopChat();
  };

  const renderMessage = ({item}: {item: any}) => (
    <ChatBubble
      message={item}
      assistantName={settings.assistantName}
      userName={settings.userName}
      language={settings.language}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{settings.assistantName}</Text>
        <VoiceIndicator />
      </View>

      <View style={styles.avatarContainer}>
        <Avatar3D />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
      />

      {/* ✅ Streaming text with Stop button */}
      {(streamingText.length > 0 || isLoading) && (
        <View style={styles.streamingContainer}>
          {streamingText.length > 0 && (
            <Text style={styles.streamingText}>{streamingText}</Text>
          )}
          <View style={styles.streamingRow}>
            <ActivityIndicator size="small" color="#4ECDC4" />
            <TouchableOpacity onPress={handleStopChat} style={styles.stopButton}>
              <Text style={styles.stopButtonText}>■ Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoicePress}
        >
          <Text style={styles.voiceButtonText}>{isListening ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={settings.language === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
          placeholderTextColor="#666"
          multiline
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <BannerAdComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1e' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2d2d44',
  },
  backButton: { color: '#4ECDC4', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  avatarContainer: { height: 200, backgroundColor: '#1a1a2e' },
  chatList: { flex: 1 },
  chatContent: { paddingVertical: 8 },
  streamingContainer: {
    padding: 12, backgroundColor: '#2d2d44',
    borderTopWidth: 1, borderTopColor: '#3d3d5c',
  },
  streamingText: { color: '#e0e0e0', fontSize: 14, marginBottom: 8 },
  streamingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stopButton: {
    backgroundColor: '#ff6b6b', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 16,
  },
  stopButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#2d2d44', backgroundColor: '#1a1a2e',
  },
  voiceButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2d2d44', justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  voiceButtonActive: { backgroundColor: '#ff6b6b' },
  voiceButtonText: { fontSize: 18 },
  input: {
    flex: 1, backgroundColor: '#2d2d44', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100,
  },
  sendButton: {
    width: 52, height: 44, borderRadius: 22,
    backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: '#2d2d44' },
  sendButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
