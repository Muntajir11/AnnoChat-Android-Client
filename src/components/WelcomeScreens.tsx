import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const screens = [
  'Welcome to the AnnoChat! Chat anonymously with strangers.',
  'Tap "Find" to start looking for a stranger to chat with.',
  'Chats are private, and no one knows your identity.',
  'Be respectful and have fun chatting!',
];

const { width, height } = Dimensions.get('window');

const WelcomeScreens = ({ onDone }: { onDone: () => void }) => {
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<string>>(null);

  const nextScreen = () => {
    if (index < screens.length - 1) {
      setIndex(index + 1);
      flatListRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      onDone();
    }
  };

  const skipToEnd = () => {
    setIndex(screens.length - 1);
    flatListRef.current?.scrollToIndex({ index: screens.length - 1 });
  };

  const Indicator = ({ scrollX }: { scrollX: Animated.Value }) => {
    return (
      <View style={styles.indicatorContainer}>
        {screens.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`indicator-${i}`}
              style={[
                styles.indicator,
                {
                  opacity,
                  transform: [{ scale }],
                  backgroundColor: i === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A00E0" />
      <LinearGradient
        colors={['#4A00E0', '#8E2DE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.skipContainer}>
          {index < screens.length - 1 && (
            <TouchableOpacity onPress={skipToEnd}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={screens}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item }) => {
            return (
              <View style={styles.slideContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.text}>{item}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.bottomContainer}>
          <Indicator scrollX={scrollX} />
          
          <TouchableOpacity onPress={nextScreen} activeOpacity={0.8}>
            <LinearGradient
              colors={['#4A00E0', '#8E2DE2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {index === screens.length - 1 ? 'Start' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  slideContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  textContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  indicator: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#4A00E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreens;