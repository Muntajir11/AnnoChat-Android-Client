import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextChatScreen } from './TextChatScreen';
import { SideDrawer } from '../components/SideDrawer';

interface TextChatScreenContainerProps {
  navigation: any;
}

export const TextChatScreenContainer: React.FC<TextChatScreenContainerProps> = ({
  navigation,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleChatStatusChange = (isConnected: boolean) => {
    // Handle chat status if needed
  };

  return (
    <View style={styles.container}>
      <TextChatScreen
        navigation={navigation}
        onMenuPress={toggleDrawer}
        onChatStatusChange={handleChatStatusChange}
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
