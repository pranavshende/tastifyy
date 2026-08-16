import { View, Text, StyleSheet } from 'react-native';
export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites — Phase F</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: '#888', fontWeight: '600' }
});
