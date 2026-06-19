import RNFS from 'react-native-fs';

export async function listDirectory(path: string): Promise<any[]> {
  try {
    const items = await RNFS.readDir(path);
    return items.map(item => ({
      name: item.name,
      path: item.path,
      isDirectory: item.isDirectory(),
      size: item.size,
      mtime: item.mtime,
    }));
  } catch (e) {
    return [];
  }
}

export async function readFile(path: string): Promise<string> {
  try {
    return await RNFS.readFile(path, 'utf8');
  } catch (e) {
    return '';
  }
}

export async function writeFile(path: string, content: string): Promise<boolean> {
  try {
    await RNFS.writeFile(path, content, 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    await RNFS.unlink(path);
    return true;
  } catch (e) {
    return false;
  }
}

export async function createDirectory(path: string): Promise<boolean> {
  try {
    await RNFS.mkdir(path);
    return true;
  } catch (e) {
    return false;
  }
}

export function getDocumentPath(): string {
  return RNFS.DocumentDirectoryPath;
}

export function getDownloadPath(): string {
  return RNFS.DownloadDirectoryPath;
}
