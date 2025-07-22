import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TextChatScreen } from '../screens';
import { VideoChatScreen } from '../screens';
import { SideDrawer } from './SideDrawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabNavigatorProps {
  navigation: any;
}

type TabType = 'text' | 'video';

export const TabNavigator: React.FC<TabNavigatorProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [hideTabBar, setHideTabBar] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleChatStatusChange = (isConnected: boolean) => {
    setHideTabBar(isConnected);
  };



  const renderTabBar = () => (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'text' && styles.activeTab,
        ]}
        onPress={() => setActiveTab('text')}
        activeOpacity={0.8}>
        <Ionicons 
          name="chatbubble-outline" 
          size={20} 
          color={activeTab === 'text' ? '#10B981' : '#6EE7B7'} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'text' && styles.activeTabText,
        ]}>
          TEXT CHAT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'video' && styles.activeTab,
        ]}
        onPress={() => setActiveTab('video')}
        activeOpacity={0.8}>
        <Ionicons 
          name="videocam-outline" 
          size={20} 
          color={activeTab === 'video' ? '#10B981' : '#6EE7B7'} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'video' && styles.activeTabText,
        ]}>
          VIDEO CHAT
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    return (
      <View style={styles.content}>
        {activeTab === 'text' ? (
          <TextChatScreen 
            navigation={navigation} 
            onMenuPress={toggleDrawer}
            onChatStatusChange={handleChatStatusChange}
          />
        ) : (
          <VideoChatScreen 
            onMenuPress={toggleDrawer}
            onChatStatusChange={handleChatStatusChange}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      {!hideTabBar && renderTabBar()}
      
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
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  activeTab: {
    backgroundColor: '#334155',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#F1F5F9',
    fontWeight: '700',
  },
});
