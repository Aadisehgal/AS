import type {Emotion} from '../types';

const HINDI_EMOTIONS: Record<string, Emotion> = {
  'खुश': 'happy',
  'खुशी': 'happy',
  'उदास': 'sad',
  'गुस्सा': 'angry',
  'गुस्से': 'angry',
  'चिंता': 'anxious',
  'चिंतित': 'anxious',
  'प्यार': 'love',
  'प्यारा': 'love',
  'नाराज': 'angry',
  'हंस': 'happy',
  'रो': 'sad',
  'डर': 'anxious',
};

const ENGLISH_EMOTIONS: Record<string, Emotion> = {
  'happy': 'happy',
  'joy': 'happy',
  'glad': 'happy',
  'excited': 'excited',
  'sad': 'sad',
  'unhappy': 'sad',
  'depressed': 'sad',
  'angry': 'angry',
  'mad': 'angry',
  'furious': 'angry',
  'anxious': 'anxious',
  'worried': 'anxious',
  'nervous': 'anxious',
  'love': 'love',
  'lovely': 'love',
  'thinking': 'thinking',
  'wonder': 'thinking',
  'neutral': 'neutral',
};

const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  happy: ['happy', 'joy', 'glad', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'love it', 'खुश', 'खुशी', 'अच्छा', 'बढ़िया'],
  sad: ['sad', 'unhappy', 'depressed', 'sorry', 'cry', 'upset', 'heartbroken', 'उदास', 'दुखी', 'रोना', 'माफ़'],
  angry: ['angry', 'mad', 'furious', 'hate', 'annoyed', 'frustrated', 'गुस्सा', 'नाराज', 'गुस्से', 'बेवकूफ'],
  anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stress', 'tense', 'चिंता', 'डर', 'घबराहट'],
  love: ['love', 'adore', 'cherish', 'affection', 'romantic', 'प्यार', 'मोहब्बत', 'इश्क'],
  excited: ['excited', 'thrilled', 'ecstatic', 'pumped', 'hyped', 'उत्साहित', 'जोश'],
  thinking: ['thinking', 'wonder', 'curious', 'ponder', 'consider', 'सोच', 'विचार'],
  neutral: ['ok', 'fine', 'alright', 'whatever', 'normal', 'ठीक', 'ठीक है'],
};

export function detectEmotion(text: string, language: string): Emotion {
  const lowerText = text.toLowerCase();

  // Check for explicit emotion words first
  if (language === 'hi') {
    for (const [word, emotion] of Object.entries(HINDI_EMOTIONS)) {
      if (lowerText.includes(word)) return emotion;
    }
  } else {
    for (const [word, emotion] of Object.entries(ENGLISH_EMOTIONS)) {
      if (lowerText.includes(word)) return emotion;
    }
  }

  // Check keyword lists
  let scores: Record<Emotion, number> = {
    happy: 0, sad: 0, angry: 0, anxious: 0, love: 0, excited: 0, thinking: 0, neutral: 0,
  };

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[emotion as Emotion] += 1;
      }
    }
  }

  // Check for punctuation patterns
  if (text.includes('!!!') || text.includes('??')) scores.excited += 1;
  if (text.includes('...')) scores.thinking += 1;

  const maxEmotion = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
  return maxEmotion[1] > 0 ? (maxEmotion[0] as Emotion) : 'neutral';
}

export function getEmotionLabel(emotion: Emotion, language: string): string {
  const labels: Record<Emotion, Record<string, string>> = {
    happy: {en: 'Happy', hi: 'Happy'},
    sad: {en: 'Sad', hi: 'Sad'},
    angry: {en: 'Angry', hi: 'Angry'},
    anxious: {en: 'Anxious', hi: 'Anxious'},
    love: {en: 'Love', hi: 'Love'},
    excited: {en: 'Excited', hi: 'Excited'},
    thinking: {en: 'Thinking', hi: 'Thinking'},
    neutral: {en: 'Neutral', hi: 'Neutral'},
  };
  return labels[emotion]?.[language] || labels[emotion]?.en || 'Neutral';
}
