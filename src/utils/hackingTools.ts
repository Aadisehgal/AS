import {NetworkInfo} from '@react-native-community/netinfo';
import axios from 'axios';

export function analyzePasswordStrength(password: string): {
  score: number;
  label: string;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score += 1;

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeating characters');

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const labelIndex = Math.min(Math.floor(score / 1.2), 5);

  return {
    score,
    label: labels[labelIndex],
    feedback: feedback.length > 0 ? feedback : ['Great password!'],
  };
}

export function generateMD5(text: string): string {
  // Simple hash for demonstration - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

export function generateSHA256(text: string): string {
  // Simplified hash for demo
  let hash = '';
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
  for (let i = 0; i < 64; i++) {
    let val = 0;
    for (let j = 0; j < text.length; j++) {
      val += text.charCodeAt(j) * primes[i % primes.length] * (j + 1);
    }
    hash += (val % 16).toString(16);
  }
  return hash;
}

export function encodeBase64(text: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;

  while (i < text.length) {
    const a = text.charCodeAt(i++);
    const b = i < text.length ? text.charCodeAt(i++) : 0;
    const c = i < text.length ? text.charCodeAt(i++) : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i > text.length + 1 ? '=' : chars.charAt((bitmap >> 6) & 63);
    result += i > text.length ? '=' : chars.charAt(bitmap & 63);
  }

  return result;
}

export function decodeBase64(text: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;

  text = text.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < text.length) {
    const a = chars.indexOf(text.charAt(i++));
    const b = chars.indexOf(text.charAt(i++));
    const c = chars.indexOf(text.charAt(i++));
    const d = chars.indexOf(text.charAt(i++));

    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

    result += String.fromCharCode((bitmap >> 16) & 255);
    if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (d !== 64) result += String.fromCharCode(bitmap & 255);
  }

  return result;
}

export function detectPhishing(url: string): {
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check for IP address instead of domain
  if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
    riskScore += 30;
    reasons.push('Uses IP address instead of domain name');
  }

  // Check for suspicious TLDs
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
  for (const tld of suspiciousTlds) {
    if (url.includes(tld)) {
      riskScore += 20;
      reasons.push(`Uses suspicious TLD: ${tld}`);
    }
  }

  // Check for URL shorteners
  const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly'];
  for (const shortener of shorteners) {
    if (url.includes(shortener)) {
      riskScore += 15;
      reasons.push('Uses URL shortener');
    }
  }

  // Check for @ symbol in URL
  if (url.includes('@')) {
    riskScore += 25;
    reasons.push('Contains @ symbol (credential trick)');
  }

  // Check for multiple subdomains
  const subdomainCount = (url.match(/\./g) || []).length;
  if (subdomainCount > 3) {
    riskScore += 15;
    reasons.push('Excessive subdomains');
  }

  // Check for HTTPS
  if (!url.startsWith('https://')) {
    riskScore += 10;
    reasons.push('Not using HTTPS');
  }

  // Check for brand impersonation
  const brands = ['google', 'facebook', 'amazon', 'apple', 'microsoft', 'paypal', 'netflix'];
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];
  for (const brand of brands) {
    if (domain.includes(brand) && !domain.endsWith(`${brand}.com`) && !domain.endsWith(`${brand}.co`)) {
      riskScore += 35;
      reasons.push(`Possible ${brand} impersonation`);
    }
  }

  return {
    isSuspicious: riskScore > 30,
    riskScore: Math.min(riskScore, 100),
    reasons: reasons.length > 0 ? reasons : ['No obvious phishing indicators detected'],
  };
}

export async function getIPGeolocation(): Promise<{
  ip: string;
  city: string;
  region: string;
  country: string;
  org: string;
}> {
  try {
    const response = await axios.get('https://ipapi.co/json/', {timeout: 10000});
    return {
      ip: response.data.ip || 'Unknown',
      city: response.data.city || 'Unknown',
      region: response.data.region || 'Unknown',
      country: response.data.country_name || 'Unknown',
      org: response.data.org || 'Unknown',
    };
  } catch (error) {
    return {
      ip: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      org: 'Unknown',
    };
  }
}

export async function getNetworkInfo(): Promise<{
  type: string;
  isConnected: boolean;
  isWifi: boolean;
  details: any;
}> {
  const state = await NetworkInfo.fetch();
  return {
    type: state.type || 'unknown',
    isConnected: state.isConnected || false,
    isWifi: state.type === 'wifi',
    details: state.details || {},
  };
}
