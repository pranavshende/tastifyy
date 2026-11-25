import { View, Text, StyleSheet } from 'react-native';
import { BrandColors } from '../../constants/theme';
export default function DeliveryDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Delivery Dashboard — Phase H</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: BrandColors.textMuted, fontWeight: '600' }
});
