import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoChatScreen } from './index';
import type { VideoChatScreenRef } from './VideoChatScreenNew';
import { SideDrawer } from '../components/SideDrawer';

interface VideoChatScreenContainerProps {
  navigation: any;
}

export const VideoChatScreenContainer: React.FC<VideoChatScreenContainerProps> = ({
  navigation,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const videoChatRef = useRef<VideoChatScreenRef>(null);

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleChatStatusChange = (isConnected: boolean) => {
    // Handle chat status if needed
  };

  return (
    <View style={styles.container}>
      <VideoChatScreen
        ref={videoChatRef}
        onMenuPress={toggleDrawer}
        onChatStatusChange={handleChatStatusChange}
        shouldAutoConnect={true}
        shouldDisconnectOnTabSwitch={false}
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
