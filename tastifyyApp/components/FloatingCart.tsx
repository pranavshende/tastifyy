import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useCartStore } from '../store/cartStore';

export default function FloatingCart({ onPress }: { onPress: () => void }) {
  const items = useCartStore(state => state.items);
  const getTotal = useCartStore(state => state.getTotal);
  
  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (items.length > 0) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleValue.setValue(0.9);
      opacityValue.setValue(0);
    }
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.leftCol}>
          <Text style={styles.itemCountText}>{items.length} ITEM{items.length !== 1 ? 'S' : ''}</Text>
          <Text style={styles.priceText}>₹{getTotal().toFixed(2)}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.checkoutText}>View Cart</Text>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 999 },
  button: { 
    backgroundColor: '#E86A22', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: 16, 
    shadowColor: '#E86A22', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 12, 
    elevation: 8 
  },
  leftCol: { flexDirection: 'column' },
  itemCountText: { color: '#FFD8C4', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  priceText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  rightCol: { flexDirection: 'row', alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 8 },
  arrowText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});
