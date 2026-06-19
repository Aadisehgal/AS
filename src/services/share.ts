import Share from 'react-native-share';

export async function shareText(text: string, title?: string): Promise<void> {
  try {
    await Share.open({
      message: text,
      title: title || 'MANU AI Share',
    });
  } catch (e) {
    // User cancelled
  }
}

export async function shareFile(filePath: string, type?: string): Promise<void> {
  try {
    await Share.open({
      url: `file://${filePath}`,
      type: type || '*/*',
    });
  } catch (e) {
    // User cancelled
  }
}
