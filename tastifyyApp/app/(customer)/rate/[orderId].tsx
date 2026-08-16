import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../../api/axios';
import { router, useLocalSearchParams } from 'expo-router';

export default function RateOrderScreen() {
  const { orderId } = useLocalSearchParams();
  const [foodRating, setFoodRating] = useState(5);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [review, setReview] = useState('');

  const submitRating = async () => {
    try {
      await api.post(`/orders/${orderId}/rate`, {
        food_rating: foodRating,
        restaurant_rating: restaurantRating,
        delivery_rating: deliveryRating,
        review_text: review,
        tags: []
      });
      Alert.alert('Success', 'Thank you for your feedback!');
      router.push('/(customer)/home');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Your Order</Text>

      <Text style={styles.label}>Food Rating (1-5)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={String(foodRating)} onChangeText={t => setFoodRating(Number(t))} />

      <Text style={styles.label}>Restaurant Rating (1-5)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={String(restaurantRating)} onChangeText={t => setRestaurantRating(Number(t))} />

      <Text style={styles.label}>Delivery Rating (1-5)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={String(deliveryRating)} onChangeText={t => setDeliveryRating(Number(t))} />

      <Text style={styles.label}>Review Comments</Text>
      <TextInput style={[styles.input, { height: 100 }]} multiline value={review} onChangeText={setReview} placeholder="How was it?" />

      <TouchableOpacity style={styles.submitBtn} onPress={submitRating}>
        <Text style={styles.submitBtnText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15 },
  submitBtn: { backgroundColor: '#E86A22', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
