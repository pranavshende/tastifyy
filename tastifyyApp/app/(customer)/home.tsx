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
import { BrandColors } from '../../constants/theme';

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
  { id: 'All', label: 'All', icon: 'silverware-fork-knife', bg: BrandColors.primaryLight, activeBg: BrandColors.primary },
  { id: 'Burgers', label: 'Burgers', icon: 'hamburger', bg: BrandColors.primaryLight, activeBg: BrandColors.primary },
  { id: 'Pizza', label: 'Pizza', icon: 'pizza', bg: BrandColors.primaryLight, activeBg: BrandColors.primary },
  { id: 'Indian', label: 'Indian', icon: 'pot-steam', bg: BrandColors.secondaryLight, activeBg: BrandColors.primary },
  { id: 'Biryani', label: 'Biryani', icon: 'rice', bg: BrandColors.secondaryLight, activeBg: BrandColors.primary },
  { id: 'Desserts', label: 'Desserts', icon: 'cake-variant', bg: BrandColors.primaryLight, activeBg: BrandColors.primary },
  { id: 'Beverages', label: 'Beverages', icon: 'cup', bg: BrandColors.secondaryLight, activeBg: BrandColors.primary },
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
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={styles.brandLogoImage}
          resizeMode="cover"
          accessibilityLabel="Tastifyy"
        />
        <Text style={styles.brandTagline}>Food Delivery</Text>
      </View>

      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(customer)/search')}
          accessibilityLabel="Search"
        >
          <Ionicons name="search-outline" size={20} color={BrandColors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(customer)/cart')}
          accessibilityLabel="View Cart"
        >
          <Ionicons name="cart-outline" size={20} color={BrandColors.text} />
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
          <Ionicons name="person-outline" size={20} color={BrandColors.text} />
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
            <Ionicons name="search" size={18} color={BrandColors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants or cuisines..."
              placeholderTextColor={BrandColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={BrandColors.textMuted} />
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
                  color={isActive ? BrandColors.surface : BrandColors.textSecondary}
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
        <Ionicons name="arrow-forward" size={14} color={BrandColors.primary} />
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
              <View style={[styles.avatarPlaceholder, { backgroundColor: BrandColors.primary }]}>
                <Ionicons name="restaurant" size={18} color={BrandColors.surface} />
              </View>
            )}
          </View>

          <View style={styles.restaurantInfoCol}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.restaurantCuisines} numberOfLines={1}>{cuisinesList}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color={BrandColors.primary} />
              <Text style={styles.ratingText}> {ratingValue} </Text>
              <Text style={styles.reviewsText}>({reviewsText})</Text>
              <Text style={styles.metaDot}>•</Text>
              <MaterialCommunityIcons name="moped" size={16} color={BrandColors.textSecondary} />
              <Text style={styles.deliveryTimeText}> {prepTime}</Text>
            </View>
          </View>

          <View style={styles.statusCol}>
            <View style={[styles.statusBadge, { backgroundColor: item.is_open ? BrandColors.secondaryLight : BrandColors.dangerLight }]}>
              <Text style={[styles.statusText, { color: item.is_open ? BrandColors.secondaryDark : BrandColors.danger }]}>
                {item.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={BrandColors.textMuted} style={{ marginTop: 6 }} />
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
                  <View style={[styles.vegIndicatorBadge, { borderColor: dish.is_veg ? BrandColors.secondary : '#EF4444' }]}>
                    <View style={[styles.vegIndicatorDot, { backgroundColor: dish.is_veg ? BrandColors.secondary : '#EF4444' }]} />
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
                      <Ionicons name="add" size={14} color={BrandColors.primary} />
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
      <StatusBar barStyle="dark-content" backgroundColor={BrandColors.surface} />
      {renderHeader()}

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BrandColors.primary]} />
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
              <Ionicons name="fast-food-outline" size={56} color={BrandColors.border} />
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
        <Ionicons name="sparkles" size={18} color={BrandColors.surface} style={{ marginRight: 6 }} />
        <Text style={styles.aiFloatingText}>Ask AI</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
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
    color: BrandColors.textMuted,
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
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.backgroundMuted,
  },
  brandRow: {
    alignItems: 'flex-start',
  },
  brandLogoImage: {
    width: 132,
    height: 48,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
    marginTop: -3,
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
    backgroundColor: BrandColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: BrandColors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: BrandColors.surface,
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
    color: BrandColors.border,
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: BrandColors.surface,
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroHighlight: {
    color: BrandColors.primary,
  },
  heroSubtext: {
    fontSize: 13,
    color: BrandColors.border,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '85%',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
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
    color: BrandColors.text,
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
    shadowColor: BrandColors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: BrandColors.primary,
    fontWeight: '900',
  },
  activeBar: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: BrandColors.textMuted,
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
    color: BrandColors.primary,
  },

  // Restaurant Card
  listContent: {
    paddingBottom: 90,
  },
  restaurantCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.backgroundMuted,
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
    backgroundColor: BrandColors.backgroundMuted,
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
    color: BrandColors.text,
  },
  restaurantCuisines: {
    fontSize: 12,
    color: BrandColors.textMuted,
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
    color: BrandColors.text,
  },
  reviewsText: {
    fontSize: 12,
    color: BrandColors.textMuted,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
    color: BrandColors.border,
  },
  deliveryTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textSecondary,
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
    backgroundColor: BrandColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.backgroundMuted,
    overflow: 'hidden',
  },
  dishImageWrap: {
    width: '100%',
    height: 80,
    backgroundColor: BrandColors.background,
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
    color: BrandColors.text,
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
    color: BrandColors.primary,
  },
  addMiniBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.primaryLight,
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
    color: BrandColors.textSecondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BrandColors.textMuted,
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
    backgroundColor: BrandColors.text,
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
    color: BrandColors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
});
