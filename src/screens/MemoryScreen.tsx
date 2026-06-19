import React, {useState, useEffect} from 'react';
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
import {
  storeMemory,
  getMemoriesByCategory,
  searchMemories,
  deleteMemory,
  getMemorySummary,
} from '../services/aiMemory';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function MemoryScreen() {
  const navigation = useNavigation();
  const [memories, setMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [category, setCategory] = useState('general');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    loadMemories();
    setSummary(getMemorySummary());
  }, []);

  const loadMemories = () => {
    const all = searchMemories('');
    setMemories(all);
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    storeMemory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      category,
      content: newMemory.trim(),
      importance: 5,
    });
    setNewMemory('');
    loadMemories();
    setSummary(getMemorySummary());
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setMemories(searchMemories(searchQuery));
    } else {
      loadMemories();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Memory', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        deleteMemory(id);
        loadMemories();
        setSummary(getMemorySummary());
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Memory</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Add Memory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Memory</Text>
          <TextInput
            style={styles.input}
            value={newMemory}
            onChangeText={setNewMemory}
            placeholder="Enter something to remember..."
            placeholderTextColor="#666"
            multiline
          />
          <View style={styles.categoryRow}>
            {['general', 'personal', 'work', 'reminder'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddMemory}>
            <Text style={styles.addButtonText}>Add Memory</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Memories</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Memory List */}
        {memories.map((memory) => (
          <View key={memory.id} style={styles.memoryCard}>
            <View style={styles.memoryHeader}>
              <Text style={styles.memoryCategory}>{memory.category}</Text>
              <TouchableOpacity onPress={() => handleDelete(memory.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.memoryContent}>{memory.content}</Text>
            <Text style={styles.memoryTime}>
              {new Date(memory.timestamp).toLocaleString()}
            </Text>
          </View>
        ))}
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
  summary: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
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
    minHeight: 80,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryButton: {
    backgroundColor: '#0f0f1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  categoryButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2d2d44',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  searchButton: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
  },
  memoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  memoryCategory: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  deleteText: {
    color: '#ff6b6b',
    fontSize: 12,
  },
  memoryContent: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 8,
  },
  memoryTime: {
    color: '#666',
    fontSize: 11,
  },
});
