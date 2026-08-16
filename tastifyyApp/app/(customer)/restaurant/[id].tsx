import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../../api/axios';
import { useCartStore } from '../../../store/cartStore';

export default function RestaurantMenu() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const cartItems = useCartStore(state => state.items);
  const cartTotal = useCartStore(state => state.getTotal());
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);

  useEffect(() => {
    api.get(`/customer/restaurants/${id}/menu`)
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;
  if (!data) return <View style={styles.center}><Text style={styles.errorText}>Restaurant not found</Text></View>;

  const { restaurant, menu } = data;

  const handleAdd = (item: any) => {
    addItem(restaurant.id, {
      menu_item_id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1
    });
  };

  const getCartQuantity = (itemId: string) => {
    return cartItems.find(i => i.menu_item_id === itemId)?.quantity || 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{restaurant.name}</Text>
            <Text style={styles.tags}>{restaurant.cuisine_tags?.join(' • ')}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>⏱ {restaurant.avg_preparation_time_mins} mins</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>📍 {restaurant.city}</Text>
            </View>
          </View>
        </View>

        {/* Menu Categories */}
        {menu.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items available right now.</Text>
          </View>
        ) : (
          menu.map((cat: any) => (
            <View key={cat.id} style={styles.categoryBlock}>
              <Text style={styles.catTitle}>{cat.name}</Text>
              
              {cat.menu_items.map((item: any) => {
                const qty = getCartQuantity(item.id);
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemTitleRow}>
                        <View style={[styles.vegIndicator, item.is_veg ? styles.veg : styles.nonVeg]} />
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
                      {item.description && <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>}
                    </View>
                    
                    <View style={styles.actionWrap}>
                      {qty > 0 ? (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                          <Text style={styles.addBtnText}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Cart */}
      {cartItems.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          onPress={() => router.push('/(customer)/cart')} // Phase F
        >
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemsText}>{cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}</Text>
            <Text style={styles.cartTotalText}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.cartBtnText}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  errorText: { fontSize: 16, color: '#EF4444', fontWeight: 'bold' },
  
  header: { backgroundColor: '#fff', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#E86A22', fontSize: 16, fontWeight: '700' },
  headerInfo: {},
  title: { fontSize: 28, fontWeight: '900', color: '#171717', marginBottom: 4 },
  tags: { fontSize: 14, color: '#888', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, fontWeight: '700', color: '#555' },
  metaDot: { marginHorizontal: 8, color: '#CCC' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888' },

  categoryBlock: { backgroundColor: '#fff', marginBottom: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 },
  catTitle: { fontSize: 20, fontWeight: '900', color: '#171717', marginBottom: 16 },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemInfo: { flex: 1, marginRight: 16 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vegIndicator: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  veg: { backgroundColor: '#22C55E' },
  nonVeg: { backgroundColor: '#EF4444' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#171717', flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 4 },
  itemDesc: { fontSize: 13, color: '#888', lineHeight: 18 },

  actionWrap: { width: 90, alignItems: 'center' },
  addBtn: { backgroundColor: '#FFF5E6', borderColor: '#E86A22', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8 },
  addBtnText: { color: '#E86A22', fontSize: 13, fontWeight: '800' },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E86A22', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  qtyText: { color: '#fff', fontSize: 14, fontWeight: '800', paddingHorizontal: 4 },

  floatingCart: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#E86A22', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#E86A22', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  cartInfo: {},
  cartItemsText: { color: '#FFD8C4', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  cartTotalText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cartBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
