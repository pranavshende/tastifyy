import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function WebPortalPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>
        Admin & Restaurant Dashboards are currently managed exclusively via the Web Portal.
      </Text>
      <Text style={styles.text}>
        Full mobile dashboards for these roles will be coming soon in a future update.
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#E86A22', marginBottom: 20 },
  subtitle: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
  text: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#E86A22', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
