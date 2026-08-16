import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../api/axios';
import { useCartStore } from '../../../store/cartStore';
import FloatingCart from '../../../components/FloatingCart';

export default function RestaurantMenu() {
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    api.get(`/restaurants/${id}/menu`)
      .then(res => setRestaurant(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;
  if (!restaurant) return <View style={styles.center}><Text>Restaurant not found</Text></View>;

  const menuItems = restaurant.menu_categories?.flatMap((cat: any) => cat.menu_items) || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurant.name}</Text>
      <Text style={styles.subtitle}>{restaurant.address_line}</Text>

      <FlatList
        data={menuItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addItem(restaurant.id, { menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1 })}
            >
              <Text style={styles.addText}>ADD</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <FloatingCart onPress={() => router.push('/(customer)/checkout')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20, marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginHorizontal: 20, marginBottom: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemPrice: { fontSize: 14, color: '#666', marginTop: 5 },
  addButton: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 5, borderWidth: 1, borderColor: '#ddd' },
  addText: { color: '#E86A22', fontWeight: 'bold' }
});
