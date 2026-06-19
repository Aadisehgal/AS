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
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  createDirectory,
  getDocumentPath,
  getDownloadPath,
} from '../services/fileManager';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function FileManagerScreen() {
  const navigation = useNavigation();
  const [currentPath, setCurrentPath] = useState(getDocumentPath());
  const [items, setItems] = useState<any[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingFile, setEditingFile] = useState('');

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    const dirItems = await listDirectory(path);
    setItems(dirItems);
  };

  const handleItemPress = (item: any) => {
    if (item.isDirectory) {
      setCurrentPath(item.path);
    } else {
      handleEditFile(item.path);
    }
  };

  const handleEditFile = async (path: string) => {
    const content = await readFile(path);
    setFileContent(content);
    setEditingFile(path);
    setShowEditor(true);
  };

  const handleSaveFile = async () => {
    if (editingFile) {
      await writeFile(editingFile, fileContent);
      Alert.alert('Saved', 'File saved successfully');
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const path = `${currentPath}/${newFileName.trim()}`;
    await writeFile(path, '');
    setNewFileName('');
    loadDirectory(currentPath);
  };

  const handleCreateDirectory = async () => {
    if (!newFileName.trim()) return;
    const path = `${currentPath}/${newFileName.trim()}`;
    await createDirectory(path);
    setNewFileName('');
    loadDirectory(currentPath);
  };

  const handleDelete = (path: string, isDir: boolean) => {
    Alert.alert('Delete', `Delete ${isDir ? 'folder' : 'file'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteFile(path);
        loadDirectory(currentPath);
      }},
    ]);
  };

  const goUp = () => {
    const parts = currentPath.split('/');
    if (parts.length > 3) {
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
  };

  if (showEditor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowEditor(false)}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{editingFile.split('/').pop()}</Text>
          <TouchableOpacity onPress={handleSaveFile}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.editor}
          value={fileContent}
          onChangeText={setFileContent}
          multiline
          textAlignVertical="top"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{currentPath}</Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={goUp}>
          <Text style={styles.toolText}>Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setCurrentPath(getDocumentPath())}>
          <Text style={styles.toolText}>Docs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setCurrentPath(getDownloadPath())}>
          <Text style={styles.toolText}>Downloads</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createRow}>
        <TextInput
          style={styles.createInput}
          value={newFileName}
          onChangeText={setNewFileName}
          placeholder="New name..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateFile}>
          <Text style={styles.createButtonText}>File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateDirectory}>
          <Text style={styles.createButtonText}>Dir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.fileList}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.fileItem}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleDelete(item.path, item.isDirectory)}
          >
            <Text style={styles.fileIcon}>{item.isDirectory ? 'Folder' : 'File'}</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.fileMeta}>
                {item.isDirectory ? 'Folder' : `${(item.size / 1024).toFixed(1)} KB`}
              </Text>
            </View>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    color: '#4ECDC4',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginHorizontal: 12,
  },
  saveButton: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toolButton: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolText: {
    color: '#fff',
    fontSize: 12,
  },
  createRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  createInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  createButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  fileIcon: {
    color: '#4ECDC4',
    fontSize: 12,
    marginRight: 12,
    width: 50,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
  },
  fileMeta: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  editor: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 16,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
});
