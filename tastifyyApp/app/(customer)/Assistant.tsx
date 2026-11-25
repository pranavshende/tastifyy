import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { BrandColors } from '../../constants/theme';

export default function AssistantScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.post('/ai/recommend', { prompt });
      setResponse(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.cardInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.vegBadge, { borderColor: item.is_veg ? BrandColors.secondary : '#EF4444' }]}>
            <View style={[styles.vegDot, { backgroundColor: item.is_veg ? BrandColors.secondary : '#EF4444' }]} />
          </View>
        </View>
        <Text style={styles.restName}>from {item.restaurant.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Food Assistant</Text>
        <Text style={styles.subtitle}>Tell me what you're craving and your budget!</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. I want spicy vegetarian food under ₹300"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color={BrandColors.surface} /> : <Text style={styles.searchBtnText}>Ask AI</Text>}
        </TouchableOpacity>
      </View>

      {response && (
        <View style={styles.responseContainer}>
          <View style={styles.aiMessageBubble}>
            <Text style={styles.aiMessageText}>🤖 {response.message}</Text>
          </View>

          <FlatList
            data={response.results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  header: { padding: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: BrandColors.surface },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.primary },
  subtitle: { fontSize: 14, color: BrandColors.textMuted, marginTop: 4 },
  
  inputContainer: { padding: 16, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  input: { backgroundColor: BrandColors.background, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 12, padding: 16, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  searchBtn: { backgroundColor: BrandColors.text, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  searchBtnText: { color: BrandColors.surface, fontSize: 16, fontWeight: '800' },

  responseContainer: { flex: 1 },
  aiMessageBubble: { backgroundColor: BrandColors.backgroundMuted, padding: 16, margin: 16, borderRadius: 16, borderTopLeftRadius: 4 },
  aiMessageText: { color: BrandColors.secondaryDark, fontSize: 16, fontWeight: '700', lineHeight: 24 },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: BrandColors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  image: { width: 100, height: '100%' },
  cardInfo: { flex: 1, padding: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '800', color: BrandColors.text, flex: 1 },
  restName: { fontSize: 12, color: BrandColors.primary, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '900', color: BrandColors.text, marginBottom: 4 },
  desc: { fontSize: 12, color: BrandColors.textSecondary, lineHeight: 18, marginBottom: 12 },
  
  addBtn: { backgroundColor: BrandColors.backgroundMuted, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: BrandColors.text, fontWeight: '700', fontSize: 12 },

  vegBadge: { width: 12, height: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  vegDot: { width: 6, height: 6, borderRadius: 3 }
});
