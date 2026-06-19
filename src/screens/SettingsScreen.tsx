import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useStore} from '../store/useStore';
import {useAvatar} from '../hooks/useAvatar';
import {useVoiceControl} from '../hooks/useVoiceControl';
import {
  initializeTTS,
  speak,
} from '../services/voice';
import {
  extractFingerprint,
  processAudioBuffer,
  isVoiceMatch,
} from '../utils/voiceFingerprint';
import type {VoiceFingerprint} from '../utils/voiceFingerprint';

export function SettingsScreen() {
  const navigation = useNavigation();
  const {settings, setSettings} = useStore();
  const {avatars, currentAvatar, changeAvatar, isAdLoading} = useAvatar();
  const {speakText} = useVoiceControl();

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [assistantName, setAssistantName] = useState(settings.assistantName);
  const [userName, setUserName] = useState(settings.userName);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(0);
  const [voiceSamples, setVoiceSamples] = useState<any[]>([]);
  const [enrolledFingerprint, setEnrolledFingerprint] = useState<VoiceFingerprint | null>(null);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setAssistantName(settings.assistantName);
    setUserName(settings.userName);
    if (settings.voiceProfile?.enrolled) {
      setEnrolledFingerprint(settings.voiceProfile as VoiceFingerprint);
    }
  }, [settings]);

  const saveSettings = () => {
    setSettings({
      apiKey: apiKey.trim(),
      assistantName: assistantName.trim() || 'MANU',
      userName: userName.trim() || 'User',
    });
    Alert.alert('Success', 'Settings saved successfully');
  };

  const startVoiceEnrollment = async () => {
    setIsEnrolling(true);
    setEnrollmentStep(0);
    setVoiceSamples([]);

    try {
      await initializeTTS(settings.language);
      await speakText(settings.language === 'hi' 
        ? 'Please record your voice by pressing the button below.'
        : 'Please record your voice by pressing the button below.');
    } catch (e) {
      Alert.alert('Error', 'Failed to initialize voice enrollment');
      setIsEnrolling(false);
    }
  };

  const recordVoiceSample = async () => {
    if (enrollmentStep >= 3) return;

    try {
      const mockAmplitudes = Array.from({length: 16000}, () => Math.random() * 2 - 1);
      const sample = processAudioBuffer(mockAmplitudes);

      const newSamples = [...voiceSamples, sample];
      setVoiceSamples(newSamples);
      setEnrollmentStep(enrollmentStep + 1);

      if (newSamples.length >= 3) {
        const fingerprint = extractFingerprint(newSamples);
        setEnrolledFingerprint(fingerprint);
        setSettings({
          voiceProfile: {
            samples: newSamples.map((s: any) => s.amplitudes),
            features: Object.values(fingerprint),
            enrolled: true,
          } as any,
        });
        setIsEnrolling(false);
        Alert.alert('Success', 'Voice fingerprint enrolled successfully!');
      } else {
        await speakText(settings.language === 'hi'
          ? `Sample ${enrollmentStep + 1} recorded. ${3 - enrollmentStep - 1} remaining.`
          : `Sample ${enrollmentStep + 1} recorded. ${3 - enrollmentStep - 1} remaining.`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to record voice sample');
    }
  };

  const testVoiceMatch = async () => {
    if (!enrolledFingerprint) {
      Alert.alert('Error', 'No voice fingerprint enrolled');
      return;
    }

    try {
      const mockAmplitudes = Array.from({length: 16000}, () => Math.random() * 2 - 1);
      const sample = processAudioBuffer(mockAmplitudes);
      const testFingerprint = extractFingerprint([sample]);
      const match = isVoiceMatch(testFingerprint, enrolledFingerprint);

      Alert.alert(
        'Voice Match Test',
        match ? 'Voice matched! Access granted.' : 'Voice did not match. Access denied.'
      );
    } catch (e) {
      Alert.alert('Error', 'Voice match test failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{width: 40}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your OpenAI API key"
            placeholderTextColor="#666"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Names</Text>
          <TextInput
            style={styles.input}
            value={assistantName}
            onChangeText={setAssistantName}
            placeholder="Assistant name (e.g., MANU)"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[styles.langButton, settings.language === 'en' && styles.langButtonActive]}
              onPress={() => setSettings({language: 'en'})}
            >
              <Text style={styles.langButtonText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, settings.language === 'hi' && styles.langButtonActive]}
              onPress={() => setSettings({language: 'hi'})}
            >
              <Text style={styles.langButtonText}>Hindi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Fingerprint</Text>
          {enrolledFingerprint ? (
            <View>
              <Text style={styles.statusText}>Voice enrolled</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={testVoiceMatch}>
                <Text style={styles.secondaryButtonText}>Test Voice Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={startVoiceEnrollment}>
                <Text style={styles.secondaryButtonText}>Re-enroll Voice</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={startVoiceEnrollment}>
              <Text style={styles.actionButtonText}>Enroll Voice Fingerprint</Text>
            </TouchableOpacity>
          )}

          {isEnrolling && (
            <View style={styles.enrollmentBox}>
              <Text style={styles.enrollmentText}>
                Step {enrollmentStep + 1} of 3
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {width: `${(enrollmentStep / 3) * 100}%`}]} />
              </View>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={recordVoiceSample}
              >
                <Text style={styles.recordButtonText}>Record Sample</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <Text style={styles.currentAvatarText}>
            Current: {currentAvatar.name}
          </Text>
          <View style={styles.avatarGrid}>
            {avatars.map((avatar) => (
              <TouchableOpacity
                key={avatar.name}
                style={[
                  styles.avatarButton,
                  currentAvatar.name === avatar.name && styles.avatarButtonActive,
                ]}
                onPress={() => changeAvatar(avatar.name.toLowerCase())}
                disabled={isAdLoading}
              >
                <View style={[styles.avatarPreview, {backgroundColor: avatar.color}]}>
                  <Text style={styles.avatarInitial}>{avatar.name[0]}</Text>
                </View>
                <Text style={styles.avatarName}>{avatar.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {isAdLoading && (
            <ActivityIndicator color="#4ECDC4" style={styles.loader} />
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    color: '#4ECDC4',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  langButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2d2d44',
  },
  langButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusText: {
    color: '#4ECDC4',
    fontSize: 14,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#4ECDC4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2d2d44',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  enrollmentBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
  },
  enrollmentText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  recordButton: {
    backgroundColor: '#ff6b6b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentAvatarText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarButtonActive: {
    borderColor: '#4ECDC4',
  },
  avatarPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarName: {
    color: '#fff',
    fontSize: 12,
  },
  loader: {
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
