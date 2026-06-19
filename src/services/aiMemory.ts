import {MMKV} from 'react-native-mmkv';

const memory = new MMKV({id: 'ai-memory'});

interface MemoryEntry {
  id: string;
  timestamp: number;
  category: string;
  content: string;
  importance: number;
}

export function storeMemory(entry: MemoryEntry): void {
  const key = `memory_${entry.id}`;
  memory.set(key, JSON.stringify(entry));
  updateCategoryIndex(entry.category, entry.id);
}

export function getMemory(id: string): MemoryEntry | null {
  const data = memory.getString(`memory_${id}`);
  return data ? JSON.parse(data) : null;
}

export function getMemoriesByCategory(category: string): MemoryEntry[] {
  const indexKey = `category_${category}`;
  const index = memory.getString(indexKey);
  if (!index) return [];
  const ids: string[] = JSON.parse(index);
  return ids.map(id => getMemory(id)).filter((m): m is MemoryEntry => m !== null);
}

export function searchMemories(query: string): MemoryEntry[] {
  const results: MemoryEntry[] = [];
  const keys = memory.getAllKeys().filter(k => k.startsWith('memory_'));
  for (const key of keys) {
    const data = memory.getString(key);
    if (data) {
      const entry: MemoryEntry = JSON.parse(data);
      if (entry.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(entry);
      }
    }
  }
  return results.sort((a, b) => b.importance - a.importance);
}

export function deleteMemory(id: string): void {
  const entry = getMemory(id);
  if (entry) {
    memory.delete(`memory_${id}`);
    const indexKey = `category_${entry.category}`;
    const index = memory.getString(indexKey);
    if (index) {
      const ids: string[] = JSON.parse(index);
      const filtered = ids.filter(i => i !== id);
      memory.set(indexKey, JSON.stringify(filtered));
    }
  }
}

export function getMemorySummary(): string {
  const keys = memory.getAllKeys().filter(k => k.startsWith('memory_'));
  return `Total memories: ${keys.length}`;
}

function updateCategoryIndex(category: string, id: string): void {
  const indexKey = `category_${category}`;
  const index = memory.getString(indexKey);
  const ids: string[] = index ? JSON.parse(index) : [];
  if (!ids.includes(id)) {
    ids.push(id);
    memory.set(indexKey, JSON.stringify(ids));
  }
}
