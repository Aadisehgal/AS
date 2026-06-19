import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DashboardScreen} from '../screens/DashboardScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {ToolsScreen} from '../screens/ToolsScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {MemoryScreen} from '../screens/MemoryScreen';
import {SchedulerScreen} from '../screens/SchedulerScreen';
import {FileManagerScreen} from '../screens/FileManagerScreen';
import {DevicesScreen} from '../screens/DevicesScreen';
import {NotificationsScreen} from '../screens/NotificationsScreen';
import {AdMobSettingsScreen} from '../screens/AdMobSettingsScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#0f0f1e'},
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Tools" component={ToolsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Memory" component={MemoryScreen} />
        <Stack.Screen name="Scheduler" component={SchedulerScreen} />
        <Stack.Screen name="FileManager" component={FileManagerScreen} />
        <Stack.Screen name="Devices" component={DevicesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="AdMob" component={AdMobSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
