import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { router } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import FloatingCart from '../../components/FloatingCart';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const cuisines = [
    { name: 'North Indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=200&auto=format&fit=crop' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=200&auto=format&fit=crop' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop' },
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=200&auto=format&fit=crop' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop' },
    { name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop' },
  ];

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/customer/restaurants');
      setRestaurants(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const filteredRestaurants = activeCategory === 'All' 
    ? restaurants 
    : restaurants.filter(r => r.cuisine_tags.some((tag: string) => tag.toLowerCase().includes(activeCategory.toLowerCase())));

  const renderOfferCard = (type: 'discount' | 'free') => {
    if (type === 'discount') {
      return (
        <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#E86A22' }]} activeOpacity={0.9}>
          <View style={styles.offerContent}>
            <Text style={styles.offerSubtitle}>First Order</Text>
            <Text style={styles.offerTitle}>50% OFF</Text>
            <Text style={styles.offerDesc}>Up to ₹200 on your first order</Text>
            <View style={styles.offerBtn}>
              <Text style={[styles.offerBtnText, { color: '#E86A22' }]}>Order Now →</Text>
            </View>
          </View>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300' }} style={styles.offerImage} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#171717' }]} activeOpacity={0.9}>
        <View style={styles.offerContent}>
          <Text style={styles.offerSubtitle}>Special Offer</Text>
          <Text style={styles.offerTitle}>FREE DELIVERY</Text>
          <Text style={styles.offerDesc}>On orders above ₹199</Text>
          <View style={styles.offerBtn}>
            <Text style={[styles.offerBtnText, { color: '#171717' }]}>Order Now →</Text>
          </View>
        </View>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=300' }} style={styles.offerImage} />
      </TouchableOpacity>
    );
  };

  const renderRestaurantCard = ({ item, isHorizontal = false }: { item: any, isHorizontal?: boolean }) => (
    <TouchableOpacity 
      style={[styles.card, isHorizontal && { width: 260, marginRight: 16, marginBottom: 4 }]} 
      activeOpacity={0.9}
      onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
    >
      <View style={styles.imageWrap}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>{item.type === 'cafe' ? '☕' : '🍔'}</Text>
          </View>
        )}
        {item.logo_url && (
          <Image source={{ uri: item.logo_url }} style={styles.logoImage} />
        )}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ 4.5</Text>
        </View>
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
          <Ionicons name="time-outline" size={14} color="#555" />
          <Text style={styles.metaText}> {item.avg_preparation_time_mins || 30} mins</Text>
          <Text style={styles.metaDot}>•</Text>
          <Ionicons name="location-outline" size={14} color="#555" />
          <Text style={styles.metaText}> {item.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name?.split(' ')[0] || 'Guest'}!</Text>
            <Text style={styles.title}>What are you craving?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(customer)/profile')}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarTextMini}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.8}
          onPress={() => router.push('/(customer)/search')}
        >
          <Ionicons name="search" size={20} color="#888" />
          <Text style={styles.searchText}>Search restaurants, food, cuisines...</Text>
        </TouchableOpacity>
      </View>

      {/* Offers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersScroll}>
        {renderOfferCard('discount')}
        {renderOfferCard('free')}
      </ScrollView>

      {/* Cuisines */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>What's on your mind?</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {cuisines.map((cat) => (
          <TouchableOpacity 
            key={cat.name} 
            style={styles.cuisineItem}
            onPress={() => setActiveCategory(cat.name)}
          >
            <View style={[styles.cuisineImageWrap, activeCategory === cat.name && styles.cuisineImageWrapActive]}>
              <Image source={{ uri: cat.image }} style={styles.cuisineImage} />
            </View>
            <Text style={[styles.cuisineText, activeCategory === cat.name && styles.cuisineTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top Rated Horizontal Scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Rated Near You</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListScroll}>
        {restaurants.slice(0, 5).map(item => (
          <React.Fragment key={`top-${item.id}`}>
            {renderRestaurantCard({ item, isHorizontal: true })}
          </React.Fragment>
        ))}
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>All Restaurants</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filteredRestaurants}
        keyExtractor={item => item.id}
        renderItem={({ item }) => renderRestaurantCard({ item })}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E86A22']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No restaurants available in this category right now.</Text>
          </View>
        }
      />

      <FloatingCart onPress={() => router.push('/(customer)/cart')} />

      <TouchableOpacity 
        style={styles.aiFab}
        onPress={() => router.push('/(customer)/Assistant')}
      >
        <Text style={styles.aiFabIcon}>✨</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#888', marginBottom: 4, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', color: '#171717', letterSpacing: -0.5 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E86A22', alignItems: 'center', justifyContent: 'center', shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  avatarTextMini: { color: '#fff', fontSize: 18, fontWeight: '800' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#EBEBEB' },
  searchText: { marginLeft: 10, color: '#888', fontSize: 15, fontWeight: '500' },
  
  offersScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  offerCard: { width: 300, height: 160, borderRadius: 24, padding: 20, marginRight: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  offerContent: { flex: 1, zIndex: 2, justifyContent: 'center' },
  offerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  offerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  offerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginBottom: 12 },
  offerBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  offerBtnText: { fontSize: 12, fontWeight: '800' },
  offerImage: { width: 120, height: 120, position: 'absolute', right: -20, bottom: -20, borderRadius: 60, opacity: 0.9, transform: [{ rotate: '-10deg' }] },

  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#171717' },
  
  categoryScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  cuisineItem: { alignItems: 'center', marginRight: 20 },
  cuisineImageWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, backgroundColor: '#fff' },
  cuisineImageWrapActive: { borderWidth: 3, borderColor: '#E86A22' },
  cuisineImage: { width: '100%', height: '100%' },
  cuisineText: { fontSize: 13, fontWeight: '700', color: '#555' },
  cuisineTextActive: { color: '#E86A22' },

  horizontalListScroll: { paddingHorizontal: 20, paddingBottom: 10 },

  list: { paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 20, marginHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 5, overflow: 'hidden' },
  imageWrap: { position: 'relative' },
  coverImage: { width: '100%', height: 180 },
  logoImage: { position: 'absolute', bottom: -24, left: 16, width: 64, height: 64, borderRadius: 16, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff' },
  ratingBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#171717' },
  
  imagePlaceholder: { height: 180, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center' },
  imageEmoji: { fontSize: 60 },
  cardInfo: { padding: 16, paddingTop: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '800', color: '#171717', flex: 1 },
  vegBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  vegText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  tags: { fontSize: 13, color: '#888', marginBottom: 12, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, fontWeight: '600', color: '#555' },
  metaDot: { marginHorizontal: 8, color: '#CCC' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', fontWeight: '500' },

  aiFab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#171717', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  aiFabIcon: { fontSize: 28 }
});
