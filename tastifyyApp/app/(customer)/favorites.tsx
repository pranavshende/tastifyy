import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>
      
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name="heart-outline" size={64} color="#CCC" />
        </View>
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyText}>You haven't added any restaurants or dishes to your favorites list.</Text>
        
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(customer)/home')}>
          <Text style={styles.browseBtnText}>Explore Restaurants</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 24, fontWeight: '900', color: '#171717' },
  
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  
  browseBtn: { backgroundColor: '#E86A22', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  browseBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
