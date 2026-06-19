import React from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {useStore} from '../store/useStore';

export function VoiceIndicator() {
  const {isListening, isSpeaking} = useStore();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isListening || isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, isSpeaking, pulseAnim]);

  if (!isListening && !isSpeaking) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [{scale: pulseAnim}],
            backgroundColor: isListening ? '#ff6b6b' : '#4ECDC4',
          },
        ]}
      />
      <View style={[styles.dot, {backgroundColor: isListening ? '#ff6b6b' : '#4ECDC4'}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
