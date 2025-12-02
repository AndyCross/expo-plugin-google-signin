import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import {
  signInWithGoogle,
  isGoogleSignInAvailable,
  GoogleSignInResult,
} from 'expo-plugin-google-signin';

// Get Web Client ID from app.json extra
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';

type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: GoogleSignInResult }
  | { status: 'error'; message: string };

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });
  const [showToken, setShowToken] = useState(false);

  const handleSignIn = async () => {
    if (!WEB_CLIENT_ID || WEB_CLIENT_ID === 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com') {
      setAuthState({
        status: 'error',
        message: 'Please set your Google Web Client ID in app.json → extra.googleWebClientId',
      });
      return;
    }

    if (!isGoogleSignInAvailable()) {
      setAuthState({
        status: 'error',
        message: 'Google Sign-In is only available on Android. This uses Credential Manager API.',
      });
      return;
    }

    setAuthState({ status: 'loading' });

    try {
      const result = await signInWithGoogle(WEB_CLIENT_ID);

      if (result) {
        setAuthState({ status: 'authenticated', user: result });
      } else {
        // User cancelled
        setAuthState({ status: 'idle' });
      }
    } catch (error: any) {
      setAuthState({
        status: 'error',
        message: error.message || 'Sign-in failed',
      });
    }
  };

  const handleSignOut = () => {
    setAuthState({ status: 'idle' });
    setShowToken(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      <View style={styles.backgroundAccent} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>expo-plugin-google-signin</Text>
          <Text style={styles.subtitle}>
            Credential Manager API with nonce support
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.card}>
          {authState.status === 'idle' && (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔐</Text>
              </View>
              <Text style={styles.cardTitle}>Welcome</Text>
              <Text style={styles.cardDescription}>
                Sign in with your Google account using Android's native Credential Manager.
              </Text>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}

          {authState.status === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4285f4" />
              <Text style={styles.loadingText}>Signing in...</Text>
            </View>
          )}

          {authState.status === 'authenticated' && (
            <>
              {authState.user.profilePictureUri ? (
                <Image
                  source={{ uri: authState.user.profilePictureUri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {authState.user.givenName?.[0] || authState.user.id[0].toUpperCase()}
                  </Text>
                </View>
              )}
              
              <Text style={styles.userName}>
                {authState.user.displayName || 'User'}
              </Text>
              <Text style={styles.userEmail}>{authState.user.id}</Text>

              {/* User details */}
              <View style={styles.detailsContainer}>
                <DetailRow label="Given Name" value={authState.user.givenName} />
                <DetailRow label="Family Name" value={authState.user.familyName} />
              </View>

              {/* Token section */}
              <TouchableOpacity
                style={styles.tokenToggle}
                onPress={() => setShowToken(!showToken)}
              >
                <Text style={styles.tokenToggleText}>
                  {showToken ? '▼ Hide ID Token' : '▶ Show ID Token'}
                </Text>
              </TouchableOpacity>

              {showToken && (
                <View style={styles.tokenContainer}>
                  <Text style={styles.tokenLabel}>ID Token (with nonce):</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    style={styles.tokenScroll}
                  >
                    <Text style={styles.tokenText} selectable>
                      {authState.user.idToken}
                    </Text>
                  </ScrollView>
                  <Text style={styles.tokenHint}>
                    Use this token for Auth0 token exchange
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}

          {authState.status === 'error' && (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⚠️</Text>
              </View>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{authState.message}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setAuthState({ status: 'idle' })}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Platform info */}
        <View style={styles.platformInfo}>
          <Text style={styles.platformText}>
            Platform: {Platform.OS} • Google Sign-In: {isGoogleSignInAvailable() ? '✓' : '✗'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  backgroundAccent: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 14,
    color: '#8888aa',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'sans-serif',
  },
  card: {
    backgroundColor: '#1e1e32',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: '#8888aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8888aa',
    marginTop: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(66, 133, 244, 0.5)',
  },
  avatarPlaceholder: {
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8888aa',
    marginBottom: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8888aa',
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  tokenToggle: {
    paddingVertical: 12,
  },
  tokenToggleText: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '500',
  },
  tokenContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#8888aa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenScroll: {
    maxHeight: 80,
  },
  tokenText: {
    fontSize: 11,
    color: '#66ff66',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tokenHint: {
    fontSize: 11,
    color: '#666688',
    marginTop: 8,
    fontStyle: 'italic',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#aa8888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  platformInfo: {
    alignItems: 'center',
    marginTop: 32,
  },
  platformText: {
    fontSize: 12,
    color: '#555566',
  },
});

