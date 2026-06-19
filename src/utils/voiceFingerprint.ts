// Simple voice fingerprinting using amplitude patterns
// In production, you'd use proper MFCC extraction, but this provides a working foundation

export interface VoiceSample {
  amplitudes: number[];
  duration: number;
  timestamp: number;
}

export interface VoiceFingerprint {
  averageAmplitude: number;
  amplitudeVariance: number;
  peakCount: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
}

export function extractFingerprint(samples: VoiceSample[]): VoiceFingerprint {
  const allAmplitudes = samples.flatMap(s => s.amplitudes);

  const averageAmplitude = allAmplitudes.reduce((a, b) => a + b, 0) / allAmplitudes.length;

  const variance = allAmplitudes.reduce((sum, amp) => sum + Math.pow(amp - averageAmplitude, 2), 0) / allAmplitudes.length;

  let peakCount = 0;
  for (let i = 1; i < allAmplitudes.length - 1; i++) {
    if (allAmplitudes[i] > allAmplitudes[i - 1] && allAmplitudes[i] > allAmplitudes[i + 1] && allAmplitudes[i] > averageAmplitude * 1.5) {
      peakCount++;
    }
  }

  let zeroCrossings = 0;
  for (let i = 1; i < allAmplitudes.length; i++) {
    if ((allAmplitudes[i] >= 0) !== (allAmplitudes[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / allAmplitudes.length;

  // Simplified spectral centroid approximation
  let weightedSum = 0;
  let totalSum = 0;
  for (let i = 0; i < allAmplitudes.length; i++) {
    const freq = i / allAmplitudes.length;
    weightedSum += freq * Math.abs(allAmplitudes[i]);
    totalSum += Math.abs(allAmplitudes[i]);
  }
  const spectralCentroid = totalSum > 0 ? weightedSum / totalSum : 0;

  return {
    averageAmplitude,
    amplitudeVariance: variance,
    peakCount,
    zeroCrossingRate,
    spectralCentroid,
  };
}

export function compareFingerprints(fp1: VoiceFingerprint, fp2: VoiceFingerprint): number {
  const weights = {
    averageAmplitude: 0.25,
    amplitudeVariance: 0.2,
    peakCount: 0.2,
    zeroCrossingRate: 0.15,
    spectralCentroid: 0.2,
  };

  let similarity = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const k = key as keyof VoiceFingerprint;
    const v1 = fp1[k];
    const v2 = fp2[k];
    const maxVal = Math.max(Math.abs(v1), Math.abs(v2), 0.001);
    const diff = Math.abs(v1 - v2) / maxVal;
    similarity += (1 - Math.min(diff, 1)) * weight;
    totalWeight += weight;
  }

  return similarity / totalWeight;
}

export function isVoiceMatch(sample: VoiceFingerprint, enrolled: VoiceFingerprint, threshold: number = 0.6): boolean {
  return compareFingerprints(sample, enrolled) >= threshold;
}

export function processAudioBuffer(buffer: number[]): VoiceSample {
  return {
    amplitudes: buffer,
    duration: buffer.length / 16000, // Assuming 16kHz sample rate
    timestamp: Date.now(),
  };
}
