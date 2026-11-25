import { View, Text, StyleSheet } from 'react-native';
import { BrandColors } from '../../constants/theme';
export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Dashboard — Phase I</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: BrandColors.textMuted, fontWeight: '600' }
});
