import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import ScholarCardScreen from './src/screens/ScholarCardScreen';
import GlobalApisScreen from './src/screens/GlobalApisScreen';
import CirculationScannerScreen from './src/screens/CirculationScannerScreen';
import HodUploadScreen from './src/screens/HodUploadScreen';

// Icons
import {
  BookOpen,
  Search,
  QrCode,
  Globe,
  Camera,
  Upload
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.cardBg,
                borderTopColor: colors.cardBorder,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 6,
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textDim,
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
              },
            }}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarLabel: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <BookOpen size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{
                tabBarLabel: 'Catalog',
                tabBarIcon: ({ color, size }) => (
                  <Search size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="ScholarCard"
              component={ScholarCardScreen}
              options={{
                tabBarLabel: 'Scholar ID',
                tabBarIcon: ({ color, size }) => (
                  <QrCode size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="GlobalApis"
              component={GlobalApisScreen}
              options={{
                tabBarLabel: 'World APIs',
                tabBarIcon: ({ color, size }) => (
                  <Globe size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Scanner"
              component={CirculationScannerScreen}
              options={{
                tabBarLabel: 'Circulation',
                tabBarIcon: ({ color, size }) => (
                  <Camera size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="HodUpload"
              component={HodUploadScreen}
              options={{
                tabBarLabel: 'HOD Upload',
                tabBarIcon: ({ color, size }) => (
                  <Upload size={20} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
