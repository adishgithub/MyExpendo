import React from 'react';
import { View } from 'react-native';
import AppNavigator from '../navigation/AppNavigator';

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}