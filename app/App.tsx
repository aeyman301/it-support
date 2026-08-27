import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import WorldScreen from './src/screens/WorldScreen';

type Route = { name: 'home' } | { name: 'world'; worldId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {route.name === 'home' ? (
          <HomeScreen onOpenWorld={(worldId) => setRoute({ name: 'world', worldId })} />
        ) : (
          <WorldScreen worldId={route.worldId} onBack={() => setRoute({ name: 'home' })} />
        )}
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
