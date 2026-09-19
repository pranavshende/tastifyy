import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as ImagePicker from 'expo-image-picker';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'register' && (!name.trim() || !phone.trim())) {
      Alert.alert('Missing Fields', 'Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('role', 'customer');
        if (dob) formData.append('dob', dob);
        if (profilePhoto) {
          const fileExtension = profilePhoto.uri.split('.').pop();
          const mimeType = profilePhoto.type === 'image' || profilePhoto.mimeType ? profilePhoto.mimeType : `image/${fileExtension}`;
          
          formData.append('profile_photo', {
            uri: profilePhoto.uri,
            name: `profile.${fileExtension}`,
            type: mimeType || 'image/jpeg'
          } as any);
        }

        res = await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/auth/login', { email, password });
      }

      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid server response');

      await setAuth(res.data.user, token);
      // Root layout's useEffect will handle the navigation
    } catch (err: any) {
      const msg = err.response?.data?.error?.message
        || err.response?.data?.error
        || err.message
        || 'Authentication failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBrowse = () => {
    // Customers can browse restaurants without logging in
    router.replace('/(customer)/home');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePhoto(result.assets[0]);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) throw new Error('Google Sign-In failed to return an ID token');

      const res = await api.post('/auth/google', { credential: idToken });
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid server response');

      await setAuth(res.data.user, token);
      // Root layout's useEffect will handle the navigation
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message
        || err.response?.data?.error
        || err.message
        || 'Google Authentication failed. Please try again.';
      Alert.alert('Google Sign-In Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header / Brand */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.brand}>Tastifyy</Text>
          <Text style={styles.tagline}>
            {mode === 'login' ? 'Welcome back! 👋' : 'Join thousands of food lovers'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'register' && (
            <>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto.uri }} style={styles.profileImage} />
                  ) : (
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#aaa"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
                value={dob}
                onChangeText={setDob}
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Auth */}
          <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Guest Browse */}
          <TouchableOpacity style={styles.ghostBtn} onPress={handleGuestBrowse}>
            <Text style={styles.ghostBtnText}>Browse as Guest 🍕</Text>
          </TouchableOpacity>

          {/* Become a Partner link */}
          <TouchableOpacity style={styles.partnerLink} onPress={() => router.push('/(auth)/register-restaurant' as any)}>
            <Text style={styles.partnerLinkText}>
              Want to list your restaurant?{' '}
              <Text style={styles.partnerLinkHighlight}>Become a Partner →</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#E86A22',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E86A22', shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10, marginBottom: 12,
  },
  logoImage: { width: 64, height: 64, borderRadius: 18 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  brand: { fontSize: 26, fontWeight: '900', color: '#171717', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 15, color: '#888', fontWeight: '500' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#F0F0F0',
    borderRadius: 14, padding: 4, marginBottom: 28,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#E86A22', fontWeight: '700' },

  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#171717',
    borderWidth: 1.5, borderColor: '#EEE',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  imagePicker: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden'
  },
  imagePickerText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600'
  },
  profileImage: {
    width: '100%', height: '100%'
  },

  primaryBtn: {
    backgroundColor: '#E86A22', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
    shadowColor: '#E86A22', shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 16, color: '#888', fontWeight: '600' },

  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  googleBtnText: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '800',
  },

  ghostBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 24 },
  ghostBtnText: { color: '#E86A22', fontSize: 16, fontWeight: '800' },

  partnerLink: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  partnerLinkText: { color: '#666', fontSize: 14, fontWeight: '600' },
  partnerLinkHighlight: { color: '#171717', fontWeight: '800' },

  footer: { textAlign: 'center', color: '#AAA', fontSize: 13, lineHeight: 18, marginTop: 'auto' }
});
