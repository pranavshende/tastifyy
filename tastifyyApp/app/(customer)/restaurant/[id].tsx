import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../../api/axios';
import { useCartStore } from '../../../store/cartStore';
import FloatingCart from '../../../components/FloatingCart';

export default function RestaurantMenu() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const cartItems = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);

  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    api.get(`/customer/restaurants/${id}/menu`)
      .then(res => {
        setData(res.data.data);
        if (res.data.data.menu?.length > 0) {
          setActiveCategory(res.data.data.menu[0].id);
        }
      })
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

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    if (categoryRefs.current[catId] !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: categoryRefs.current[catId] - 60, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image Header */}
        <View style={styles.coverWrap}>
          {restaurant.cover_image_url ? (
            <Image source={{ uri: restaurant.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#171717" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Header */}
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>{restaurant.name}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ 4.5</Text>
              </View>
            </View>
            <Text style={styles.tags}>{restaurant.cuisine_tags?.join(' • ')}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Ionicons name="time" size={16} color="#E86A22" />
                <Text style={styles.metaText}>{restaurant.avg_preparation_time_mins} mins</Text>
              </View>
              <View style={styles.metaCol}>
                <Ionicons name="location" size={16} color="#E86A22" />
                <Text style={styles.metaText}>{restaurant.city}</Text>
              </View>
              <View style={styles.metaCol}>
                <Ionicons name="bicycle" size={16} color="#E86A22" />
                <Text style={styles.metaText}>Free Delivery</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Categories Horizontal */}
        {menu.length > 0 && (
          <View style={styles.catTabWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabs}>
              {menu.map((cat: any) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]}
                  onPress={() => scrollToCategory(cat.id)}
                >
                  <Text style={[styles.catTabText, activeCategory === cat.id && styles.catTabTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        {menu.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items available right now.</Text>
          </View>
        ) : (
          menu.map((cat: any) => (
            <View 
              key={cat.id} 
              style={styles.categoryBlock}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                categoryRefs.current[cat.id] = layout.y;
              }}
            >
              <Text style={styles.catTitle}>{cat.name}</Text>
              
              {cat.menu_items.map((item: any, index: number) => {
                const qty = getCartQuantity(item.id);
                const isLast = index === cat.menu_items.length - 1;
                
                return (
                  <View key={item.id} style={[styles.itemRow, isLast && styles.itemRowNoBorder]}>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemTitleRow}>
                        <View style={styles.vegIconBox}>
                          <View style={[styles.vegIconDot, item.is_veg ? styles.veg : styles.nonVeg]} />
                        </View>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
                      {item.description && <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>}
                    </View>
                    
                    <View style={styles.itemRight}>
                      <View style={styles.itemImageWrap}>
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                        ) : (
                          <View style={styles.itemImagePlaceholder}>
                            <Ionicons name="restaurant-outline" size={24} color="#CCC" />
                          </View>
                        )}
                        
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
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <FloatingCart onPress={() => router.push('/(customer)/cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  errorText: { fontSize: 16, color: '#EF4444', fontWeight: 'bold' },
  
  coverWrap: { position: 'relative', width: '100%', height: 260, backgroundColor: '#171717' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: '#FFEAE6' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtnAbsolute: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },

  header: { marginTop: -40, paddingHorizontal: 20, zIndex: 10 },
  headerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#171717', flex: 1, lineHeight: 30 },
  ratingBadge: { backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 12, marginTop: 4 },
  ratingText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tags: { fontSize: 14, color: '#888', marginBottom: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  metaCol: { alignItems: 'center' },
  metaText: { fontSize: 13, fontWeight: '700', color: '#171717', marginTop: 4 },

  catTabWrap: { marginTop: 20, marginBottom: 8, backgroundColor: '#FAFAFA' },
  catTabs: { paddingHorizontal: 20, paddingVertical: 8, gap: 12 },
  catTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EBEBEB', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  catTabActive: { backgroundColor: '#E86A22', borderColor: '#E86A22' },
  catTabText: { color: '#555', fontWeight: '700', fontSize: 14 },
  catTabTextActive: { color: '#fff' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888' },

  categoryBlock: { backgroundColor: '#fff', marginBottom: 16, padding: 20, paddingBottom: 0 },
  catTitle: { fontSize: 22, fontWeight: '900', color: '#171717', marginBottom: 20 },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 24, marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemRowNoBorder: { borderBottomWidth: 0, paddingBottom: 20, marginBottom: 0 },
  itemInfo: { flex: 1, marginRight: 20 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  vegIconBox: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#999', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 4 },
  veg: { backgroundColor: '#059669', borderColor: '#059669' },
  nonVeg: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  vegIconDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#171717', flex: 1, lineHeight: 22 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 8 },
  itemDesc: { fontSize: 13, color: '#888', lineHeight: 20, fontWeight: '500' },

  itemRight: { alignItems: 'center', width: 130 },
  itemImageWrap: { position: 'relative', width: 130, height: 130, alignItems: 'center' },
  itemImage: { width: 130, height: 130, borderRadius: 16 },
  itemImagePlaceholder: { width: 130, height: 130, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  
  actionWrap: { position: 'absolute', bottom: -16, width: 100, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#E86A22', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  addBtn: { width: '100%', borderColor: '#EBEBEB', borderWidth: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff' },
  addBtnText: { color: '#E86A22', fontSize: 16, fontWeight: '900' },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderColor: '#EBEBEB', borderWidth: 1, borderRadius: 12, justifyContent: 'space-between', paddingHorizontal: 4 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  qtyBtnText: { color: '#E86A22', fontSize: 18, fontWeight: '900' },
  qtyText: { color: '#171717', fontSize: 15, fontWeight: '900' }
});
