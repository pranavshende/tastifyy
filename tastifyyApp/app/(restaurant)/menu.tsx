import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import api from '../../api/axios';
import { BrandColors } from '../../constants/theme';

export default function RestaurantMenu() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setCategories(prev => prev.map(cat => ({
        ...cat,
        menu_items: cat.menu_items?.map((item: any) => 
          item.id === id ? { ...item, is_available: !currentStatus } : item
        )
      })));

      await api.patch(`/menu/items/${id}/status`, { is_available: !currentStatus });
    } catch (err) {
      Alert.alert('Error', 'Failed to update item status');
      fetchMenu(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Management</Text>
        <Text style={styles.subtitle}>Toggle item availability instantly</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BrandColors.primary]} />}
      >
        {categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Your menu is empty.</Text>
            <Text style={styles.emptySub}>Use the Web Dashboard to add categories and items.</Text>
          </View>
        ) : (
          categories.map(cat => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catTitle}>{cat.name}</Text>
              </View>
              
              {cat.menu_items?.length === 0 ? (
                <Text style={styles.noItems}>No items in this category.</Text>
              ) : (
                <View style={styles.itemsList}>
                  {cat.menu_items?.map((item: any, index: number) => (
                    <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemBorder]}>
                      <View style={styles.itemInfo}>
                        <View style={styles.itemTitleRow}>
                          <View style={[styles.vegIndicator, item.is_veg ? styles.veg : styles.nonVeg]} />
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        </View>
                        <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.toggleBtn, item.is_available ? styles.toggleOn : styles.toggleOff]}
                        onPress={() => toggleAvailability(item.id, item.is_available)}
                      >
                        <Text style={[styles.toggleText, item.is_available ? styles.toggleTextOn : styles.toggleTextOff]}>
                          {item.is_available ? 'In Stock' : 'Out of Stock'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.text },
  subtitle: { fontSize: 15, color: BrandColors.textMuted, marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '700', color: BrandColors.textSecondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: BrandColors.textMuted, textAlign: 'center', lineHeight: 20 },
  
  categoryCard: { backgroundColor: BrandColors.surface, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
  catHeader: { backgroundColor: BrandColors.background, padding: 16, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  catTitle: { fontSize: 18, fontWeight: '800', color: BrandColors.text },
  noItems: { padding: 16, color: BrandColors.textMuted, fontSize: 14, fontStyle: 'italic' },
  
  itemsList: { paddingHorizontal: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  itemBorder: { borderTopWidth: 1, borderTopColor: BrandColors.border },
  itemInfo: { flex: 1, marginRight: 16 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vegIndicator: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  veg: { backgroundColor: BrandColors.secondary },
  nonVeg: { backgroundColor: '#EF4444' },
  itemName: { fontSize: 16, fontWeight: '700', color: BrandColors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: BrandColors.primary, paddingLeft: 18 },
  
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  toggleOn: { backgroundColor: BrandColors.secondaryLight, borderColor: BrandColors.secondary },
  toggleOff: { backgroundColor: BrandColors.background, borderColor: BrandColors.border },
  toggleText: { fontSize: 12, fontWeight: '700' },
  toggleTextOn: { color: BrandColors.secondary },
  toggleTextOff: { color: BrandColors.textMuted },
});
