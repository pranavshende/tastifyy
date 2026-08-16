import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import api from '../../api/axios';
import { router } from 'expo-router';
import { useCartStore } from '../../store/cartStore';

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.getTotal());

  useEffect(() => {
    api.get('/customer/restaurants')
      .then(res => setRestaurants(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const renderRestaurant = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageEmoji}>{item.type === 'cafe' ? '☕' : '🍔'}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.is_pure_veg && <View style={styles.vegBadge}><Text style={styles.vegText}>VEG</Text></View>}
        </View>
        <Text style={styles.tags} numberOfLines={1}>
          {item.cuisine_tags.length > 0 ? item.cuisine_tags.join(' • ') : 'Various Cuisines'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⏱ {item.avg_preparation_time_mins || 30} mins</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>📍 {item.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning!</Text>
        <Text style={styles.title}>What are you craving?</Text>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={item => item.id}
        renderItem={renderRestaurant}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No restaurants available right now.</Text>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          onPress={() => router.push('/(customer)/cart')} // We'll build cart screen later
        >
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemsText}>{cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}</Text>
            <Text style={styles.cartTotalText}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.cartBtnText}>View Cart →</Text>
        </TouchableOpacity>
      )}

      {!cartItems.length && (
        <TouchableOpacity 
          style={styles.aiFab}
          onPress={() => router.push('/(customer)/Assistant')}
        >
          <Text style={styles.aiFabIcon}>✨</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  greeting: { fontSize: 16, color: '#888', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 5, overflow: 'hidden' },
  imagePlaceholder: { height: 140, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center' },
  imageEmoji: { fontSize: 60 },
  cardInfo: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '800', color: '#171717', flex: 1 },
  vegBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  vegText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  tags: { fontSize: 14, color: '#888', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, fontWeight: '600', color: '#555' },
  metaDot: { marginHorizontal: 8, color: '#CCC' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },

  floatingCart: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#E86A22', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#E86A22', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  cartInfo: {},
  cartItemsText: { color: '#FFD8C4', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  cartTotalText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cartBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  aiFab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#171717', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  aiFabIcon: { fontSize: 28 }
});
