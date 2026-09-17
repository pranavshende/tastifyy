import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, StatusBar } from 'react-native';
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

  const categories = ['All', 'Biryani', 'Pizza', 'Burgers', 'Chinese', 'South Indian', 'Desserts', 'Healthy', 'Beverages'];

  useEffect(() => {
    api.get('/customer/restaurants')
      .then(res => {
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
      <View style={styles.imageWrap}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>{item.type === 'cafe' ? '☕' : '🍔'}</Text>
          </View>
        )}
        <View style={styles.imageOverlay} />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ 4.5</Text>
        </View>
      </View>
      
      <View style={styles.cardInfo}>
        {item.logo_url && (
          <View style={styles.logoWrap}>
             <Image source={{ uri: item.logo_url }} style={styles.logoImage} />
          </View>
        )}
        <View style={[styles.titleContent, item.logo_url && { paddingLeft: 60 }]}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.is_pure_veg && <View style={styles.vegBadge}><Text style={styles.vegText}>VEG</Text></View>}
          </View>
          <Text style={styles.tags} numberOfLines={1}>
            {item.cuisine_tags.length > 0 ? item.cuisine_tags.join(' • ') : 'Various Cuisines'}
          </Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#E86A22" />
            <Text style={styles.metaText}>{item.avg_preparation_time_mins || 30} mins</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={16} color="#E86A22" />
            <Text style={styles.metaText}>{item.city}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#CCC" />
            </TouchableOpacity>
          )}
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    paddingTop: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#171717',
    fontWeight: '500'
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
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
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
  
  vegIconBox: { width: 14, height: 14, borderWidth: 1.5, borderColor: '#999', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  vegIconBoxActive: { borderColor: '#059669' },
  vegIconDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  vegIconDotActive: { backgroundColor: '#059669' },

  categoriesWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16
  },
  categoriesScroll: { paddingHorizontal: 16, gap: 10 },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2
  },
  categoryPillActive: {
    backgroundColor: '#E86A22',
    borderColor: '#E86A22',
  },
  categoryPillText: { fontSize: 14, fontWeight: '700', color: '#666' },
  categoryPillTextActive: { color: '#fff' },

  list: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  imageWrap: { position: 'relative', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  coverImage: { width: '100%', height: 180 },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.1)' },
  
  ratingBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  ratingText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  
  imagePlaceholder: { height: 180, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center' },
  imageEmoji: { fontSize: 60 },
  
  cardInfo: { padding: 20, position: 'relative' },
  logoWrap: { position: 'absolute', top: -30, left: 20, width: 64, height: 64, borderRadius: 16, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  logoImage: { width: '100%', height: '100%', borderRadius: 13 },
  
  titleContent: {},
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '900', color: '#171717', flex: 1, lineHeight: 26 },
  vegBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, marginLeft: 8, alignSelf: 'flex-start' },
  vegText: { color: '#10B981', fontSize: 10, fontWeight: '900' },
  tags: { fontSize: 14, color: '#888', fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, fontWeight: '700', color: '#171717', marginLeft: 6 },

  empty: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#171717', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  clearBtn: {
    paddingHorizontal: 24, paddingVertical: 14,
    borderWidth: 2, borderColor: '#E86A22', borderRadius: 16
  },
  clearBtnText: { color: '#E86A22', fontWeight: '900', fontSize: 15 }
});
