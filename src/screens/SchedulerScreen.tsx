import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {scheduleTask, cancelTask, cancelAllTasks, getActiveTasks} from '../services/scheduler';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function SchedulerScreen() {
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('5');
  const [taskType, setTaskType] = useState<'reminder' | 'weather' | 'news' | 'custom'>('reminder');
  const [repeat, setRepeat] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);

  const handleSchedule = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    const delay = parseInt(delayMinutes, 10) * 60 * 1000;
    const taskId = `task_${Date.now()}`;
    scheduleTask({
      id: taskId,
      type: taskType,
      time: Date.now() + delay,
      message: message.trim(),
      repeat,
      interval: repeat ? delay : undefined,
    });
    setTasks(getActiveTasks());
    setMessage('');
    Alert.alert('Scheduled', `Task will run in ${delayMinutes} minutes`);
  };

  const handleCancelAll = () => {
    cancelAllTasks();
    setTasks([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Scheduler</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule a Task</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="What should I remind you?"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            value={delayMinutes}
            onChangeText={setDelayMinutes}
            placeholder="Delay in minutes"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
          <View style={styles.typeRow}>
            {(['reminder', 'weather', 'news', 'custom'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, taskType === t && styles.typeButtonActive]}
                onPress={() => setTaskType(t)}
              >
                <Text style={styles.typeText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.repeatButton, repeat && styles.repeatButtonActive]}
            onPress={() => setRepeat(!repeat)}
          >
            <Text style={styles.repeatText}>{repeat ? 'Repeating: ON' : 'Repeat: OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
            <Text style={styles.scheduleButtonText}>Schedule Task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Tasks ({tasks.length})</Text>
          {tasks.length === 0 && <Text style={styles.emptyText}>No active tasks</Text>}
          {tasks.map((taskId) => (
            <View key={taskId} style={styles.taskItem}>
              <Text style={styles.taskId}>{taskId}</Text>
              <TouchableOpacity onPress={() => { cancelTask(taskId); setTasks(getActiveTasks()); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))}
          {tasks.length > 0 && (
            <TouchableOpacity style={styles.cancelAllButton} onPress={handleCancelAll}>
              <Text style={styles.cancelAllText}>Cancel All</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <BannerAdComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    color: '#4ECDC4',
    fontSize: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    backgroundColor: '#0f0f1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  typeButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2d2d44',
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
  },
  repeatButton: {
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  repeatButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2d2d44',
  },
  repeatText: {
    color: '#fff',
  },
  scheduleButton: {
    backgroundColor: '#4ECDC4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  taskId: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  cancelText: {
    color: '#ff6b6b',
    fontSize: 13,
  },
  cancelAllButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  cancelAllText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
