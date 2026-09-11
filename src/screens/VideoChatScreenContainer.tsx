import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoChatScreen } from './video/VideoChatScreen';
import { SideDrawer } from '../components/SideDrawer';

interface VideoChatScreenContainerProps {
  navigation: any;
}

export const VideoChatScreenContainer: React.FC<VideoChatScreenContainerProps> = ({
  navigation,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  return (
    <View style={styles.container}>
      <VideoChatScreen
        navigation={navigation}
        onMenuPress={toggleDrawer}
        onChatStatusChange={() => undefined}
      />
      <SideDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
