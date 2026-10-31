import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { router } from 'expo-router';
import { useCartStore } from '../../store/cartStore';

const { width } = Dimensions.get('window');

interface MenuItemPreview {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  is_veg: boolean;
  is_bestseller?: boolean;
}

interface RestaurantItem {
  id: string;
  name: string;
  type: string;
  address_line: string;
  city: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  avg_preparation_time_mins?: number;
  is_open: boolean;
  rating?: number;
  reviews_count?: number;
  logo_url?: string | null;
  cover_image_url?: string | null;
  menu_items?: MenuItemPreview[];
}

const CUISINE_CATEGORIES = [
  { id: 'All', label: 'All', icon: 'silverware-fork-knife', bg: '#FFF0E6', activeBg: '#E86A22' },
  { id: 'Burgers', label: 'Burgers', icon: 'hamburger', bg: '#FEF3C7', activeBg: '#E86A22' },
  { id: 'Pizza', label: 'Pizza', icon: 'pizza', bg: '#FEE2E2', activeBg: '#E86A22' },
  { id: 'Indian', label: 'Indian', icon: 'pot-steam', bg: '#DCFCE7', activeBg: '#E86A22' },
  { id: 'Biryani', label: 'Biryani', icon: 'rice', bg: '#EDE9FE', activeBg: '#E86A22' },
  { id: 'Desserts', label: 'Desserts', icon: 'cake-variant', bg: '#FCE7F3', activeBg: '#E86A22' },
  { id: 'Beverages', label: 'Beverages', icon: 'cup', bg: '#E0F2FE', activeBg: '#E86A22' },
];

export default function CustomerHome() {
  const { user } = useAuthStore();
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cartItems = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/customer/restaurants');
      setRestaurants(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
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

  const filteredRestaurants = restaurants.filter(r => {
    // Search query filter
    const matchesSearch = searchQuery.trim() === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.menu_items && r.menu_items.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    // Category filter
    if (activeCategory === 'All') return true;

    const cat = activeCategory.toLowerCase();
    const tagMatch = r.cuisine_tags.some(t => t.toLowerCase().includes(cat));
    const itemMatch = r.menu_items && r.menu_items.some(m => m.name.toLowerCase().includes(cat));

    if (cat === 'indian') {
      return tagMatch || itemMatch || r.is_pure_veg;
    }
    return tagMatch || itemMatch;
  });

  const handleQuickAdd = (restaurantId: string, item: MenuItemPreview, e: any) => {
    e.stopPropagation?.();
    addItem(restaurantId, {
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
    });
  };

  const renderHeader = () => (
    <View style={styles.topHeader}>
      <View style={styles.brandRow}>
        <View style={styles.brandLogoBox}>
          <Ionicons name="restaurant" size={20} color="#fff" />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandName}>Tastifyy</Text>
          <Text style={styles.brandTagline}>Food Delivery</Text>
        </View>
      </View>

      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(customer)/search')}
          accessibilityLabel="Search"
        >
          <Ionicons name="search-outline" size={20} color="#171717" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(customer)/cart')}
          accessibilityLabel="View Cart"
        >
          <Ionicons name="cart-outline" size={20} color="#171717" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(customer)/profile')}
          accessibilityLabel="Profile"
        >
          <Ionicons name="person-outline" size={20} color="#171717" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeroBanner = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroCard}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.moodPill}>
            <Text style={styles.moodText}>Good Food • Great Mood</Text>
          </View>

          <Text style={styles.heroHeadline}>
            Multiple Restaurants{'\n'}
            <Text style={styles.heroHighlight}>One Platform</Text>
          </Text>

          <Text style={styles.heroSubtext}>
            Explore a variety of cuisines from your favorite restaurants.
          </Text>

          <TouchableOpacity
            style={styles.searchPill}
            activeOpacity={0.9}
            onPress={() => router.push('/(customer)/search')}
          >
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants or cuisines..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCuisineCategories = () => (
    <View style={styles.categoriesSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CUISINE_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.8}
              onPress={() => setActiveCategory(cat.id)}
            >
              <View
                style={[
                  styles.categoryIconCircle,
                  { backgroundColor: isActive ? cat.activeBg : cat.bg },
                  isActive && styles.categoryIconCircleActive
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={24}
                  color={isActive ? '#ffffff' : '#4B5563'}
                />
              </View>
              <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>Top Restaurants</Text>
        <Text style={styles.sectionSubtitle}>Discover the best food from top restaurants near you.</Text>
      </View>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => {
          setActiveCategory('All');
          setSearchQuery('');
        }}
      >
        <Text style={styles.viewAllText}>View All</Text>
        <Ionicons name="arrow-forward" size={14} color="#E86A22" />
      </TouchableOpacity>
    </View>
  );

  const renderRestaurantCard = ({ item }: { item: RestaurantItem }) => {
    const hasItems = item.menu_items && item.menu_items.length > 0;
    const ratingValue = item.rating ? item.rating.toFixed(1) : '4.5';
    const reviewsText = item.reviews_count ? `${item.reviews_count}+` : '1.2k+';
    const prepTime = item.avg_preparation_time_mins ? `${item.avg_preparation_time_mins} min` : '30-40 min';
    const cuisinesList = item.cuisine_tags.length > 0 ? item.cuisine_tags.join(' • ') : 'Delicious Bites';

    return (
      <View style={styles.restaurantCard}>
        {/* Restaurant Header */}
        <TouchableOpacity
          style={styles.restaurantHeaderRow}
          activeOpacity={0.85}
          onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
        >
          <View style={styles.restaurantAvatar}>
            {item.logo_url ? (
              <Image source={{ uri: item.logo_url }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#800000' }]}>
                <Ionicons name="restaurant" size={18} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.restaurantInfoCol}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.restaurantCuisines} numberOfLines={1}>{cuisinesList}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}> {ratingValue} </Text>
              <Text style={styles.reviewsText}>({reviewsText})</Text>
              <Text style={styles.metaDot}>•</Text>
              <MaterialCommunityIcons name="moped" size={16} color="#4B5563" />
              <Text style={styles.deliveryTimeText}> {prepTime}</Text>
            </View>
          </View>

          <View style={styles.statusCol}>
            <View style={[styles.statusBadge, { backgroundColor: item.is_open ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: item.is_open ? '#15803D' : '#B91C1C' }]}>
                {item.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginTop: 6 }} />
          </View>
        </TouchableOpacity>

        {/* Horizontal Dishes Carousel */}
        {hasItems && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dishesScroll}
          >
            {item.menu_items!.map(dish => (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
              >
                <View style={styles.dishImageWrap}>
                  <Image
                    source={{
                      uri: dish.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'
                    }}
                    style={styles.dishImage}
                  />
                  <View style={[styles.vegIndicatorBadge, { borderColor: dish.is_veg ? '#10B981' : '#EF4444' }]}>
                    <View style={[styles.vegIndicatorDot, { backgroundColor: dish.is_veg ? '#10B981' : '#EF4444' }]} />
                  </View>
                </View>

                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                  <View style={styles.dishPriceRow}>
                    <Text style={styles.dishPrice}>₹{dish.price}</Text>
                    <TouchableOpacity
                      style={styles.addMiniBtn}
                      onPress={(e) => handleQuickAdd(item.id, dish, e)}
                    >
                      <Ionicons name="add" size={14} color="#E86A22" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderHeader()}

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#E86A22" />
          <Text style={styles.loadingText}>Fetching delicious restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={item => item.id}
          renderItem={renderRestaurantCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E86A22']} />
          }
          ListHeaderComponent={
            <>
              {renderHeroBanner()}
              {renderCuisineCategories()}
              {renderSectionHeader()}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Restaurants Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No results matching "${searchQuery}". Try a different keyword.`
                  : 'No restaurants available in this category right now.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating AI Assistant Access */}
      <TouchableOpacity
        style={styles.aiFloatingBtn}
        activeOpacity={0.9}
        onPress={() => router.push('/(customer)/Assistant')}
      >
        <Ionicons name="sparkles" size={18} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.aiFloatingText}>Ask AI</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E86A22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#E86A22',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: -2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E86A22',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  // Hero Banner
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 220,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  heroContent: {
    padding: 20,
    zIndex: 2,
  },
  moodPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  moodText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroHighlight: {
    color: '#E86A22',
  },
  heroSubtext: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '85%',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 99,
    paddingHorizontal: 16,
    height: 46,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
  },

  // Cuisine Categories
  categoriesSection: {
    paddingVertical: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 60,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    shadowColor: '#E86A22',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#E86A22',
    fontWeight: '900',
  },
  activeBar: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E86A22',
    marginTop: 4,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E86A22',
  },

  // Restaurant Card
  listContent: {
    paddingBottom: 90,
  },
  restaurantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  restaurantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfoCol: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  restaurantCuisines: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
    color: '#D1D5DB',
  },
  deliveryTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  statusCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Dishes Carousel
  dishesScroll: {
    paddingTop: 14,
    gap: 12,
  },
  dishCard: {
    width: 120,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  dishImageWrap: {
    width: '100%',
    height: 80,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vegIndicatorBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishInfo: {
    padding: 8,
  },
  dishName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  dishPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E86A22',
  },
  addMiniBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Floating AI Assistant
  aiFloatingBtn: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 999,
  },
  aiFloatingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
