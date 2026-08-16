import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { router } from 'expo-router';

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user location for now
    api.get('/restaurants/nearby?lat=12.9716&lng=77.5946')
      .then(res => setRestaurants(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Restaurants</Text>
      <FlatList
        data={restaurants}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.distance?.toFixed(2)} km away • {item.avg_preparation_time_mins} mins</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  meta: { fontSize: 14, color: '#666', marginTop: 5 }
});
