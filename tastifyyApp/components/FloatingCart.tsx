import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCartStore } from '../store/cartStore';

export default function FloatingCart({ onPress }: { onPress: () => void }) {
  const items = useCartStore(state => state.items);
  const getTotal = useCartStore(state => state.getTotal);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{items.length} ITEM(S)</Text>
        <Text style={styles.text}>View Cart → ₹{getTotal()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  button: { backgroundColor: '#E86A22', flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
