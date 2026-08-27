import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isPureVegOnly, setIsPureVegOnly] = useState(false);
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Biryani', 'Pizza', 'Burgers', 'Chinese', 'South Indian', 'Desserts'];

  useEffect(() => {
    api.get('/customer/restaurants')
      .then(res => {
        // Handle both standardized data format and direct array
        const data = res.data.data || res.data;
        setRestaurants(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.cuisine_tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !isPureVegOnly || r.is_pure_veg;
    const matchesOpen = !isOpenOnly || r.is_open;
    const matchesCategory = activeCategory === 'All' || r.cuisine_tags.some((tag: string) => tag.toLowerCase().includes(activeCategory.toLowerCase()));

    return matchesSearch && matchesVeg && matchesOpen && matchesCategory;
  });

  const renderRestaurant = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push(`/(customer)/restaurant/${item.id}` as any)}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.quickFilters}>
          <TouchableOpacity 
            style={[styles.filterChip, isPureVegOnly && styles.filterChipActiveVeg]} 
            onPress={() => setIsPureVegOnly(!isPureVegOnly)}
          >
            <View style={[styles.vegIconBox, isPureVegOnly && styles.vegIconBoxActive]}>
              <View style={[styles.vegIconDot, isPureVegOnly && styles.vegIconDotActive]} />
            </View>
            <Text style={[styles.filterChipText, isPureVegOnly && styles.filterChipTextActiveVeg]}>Pure Veg</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, isOpenOnly && styles.filterChipActive]} 
            onPress={() => setIsOpenOnly(!isOpenOnly)}
          >
            <Text style={[styles.filterChipText, isOpenOnly && styles.filterChipTextActive]}>Open Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={item => item.id}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptyText}>We couldn't find any places matching your current filters.</Text>
              <TouchableOpacity 
                style={styles.clearBtn}
                onPress={() => {
                  setSearchQuery('');
                  setIsPureVegOnly(false);
                  setIsOpenOnly(false);
                  setActiveCategory('All');
                }}
              >
                <Text style={styles.clearBtnText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    paddingTop: 60, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#171717'
  },
  
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff'
  },
  filterChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717'
  },
  filterChipActiveVeg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#666' },
  filterChipTextActive: { color: '#fff' },
  filterChipTextActiveVeg: { color: '#059669' },
  
  vegIconBox: { width: 12, height: 12, borderWidth: 1, borderColor: '#999', borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegIconBoxActive: { borderColor: '#059669' },
  vegIconDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  vegIconDotActive: { backgroundColor: '#059669' },

  categoriesWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12
  },
  categoriesScroll: { paddingHorizontal: 16, gap: 10 },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff'
  },
  categoryPillActive: {
    backgroundColor: '#E86A22',
    borderColor: '#E86A22',
    shadowColor: '#E86A22',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  categoryPillText: { fontSize: 14, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#fff' },

  list: { padding: 16, paddingBottom: 40 },
  
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

  empty: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#171717', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  clearBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 2, borderColor: '#E86A22', borderRadius: 12
  },
  clearBtnText: { color: '#E86A22', fontWeight: '800', fontSize: 15 }
});
