/**
 * expo-plugin-google-signin
 *
 * Google Sign-In for Android using Credential Manager API with nonce support.
 * Ideal for Auth0 token exchange flows.
 *
 * @example
 * ```typescript
 * import { signInWithGoogle, isGoogleSignInAvailable } from 'expo-plugin-google-signin';
 *
 * if (isGoogleSignInAvailable()) {
 *   const result = await signInWithGoogle(WEB_CLIENT_ID);
 *   if (result) {
 *     console.log('Signed in:', result.displayName);
 *     // Use result.idToken for Auth0 token exchange
 *   }
 * }
 * ```
 */

import { NativeModules, Platform } from 'react-native';

const { GoogleCredentialModule } = NativeModules;

/**
 * Result from a successful Google Sign-In
 */
export interface GoogleSignInResult {
  /**
   * The ID token from Google. This token includes a nonce and can be
   * used for Auth0 token exchange or server-side verification.
   */
  idToken: string;

  /**
   * The user's email address (Google account ID)
   */
  id: string;

  /**
   * The user's display name, or null if not available
   */
  displayName: string | null;

  /**
   * The user's given (first) name, or null if not available
   */
  givenName: string | null;

  /**
   * The user's family (last) name, or null if not available
   */
  familyName: string | null;

  /**
   * URI to the user's profile picture, or null if not available
   */
  profilePictureUri: string | null;
}

/**
 * Error codes that can be thrown during sign-in
 */
export enum GoogleSignInErrorCode {
  /** User cancelled the sign-in flow */
  SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED',
  /** No Google account/credential available on device */
  NO_CREDENTIAL = 'NO_CREDENTIAL',
  /** General credential manager error */
  CREDENTIAL_ERROR = 'CREDENTIAL_ERROR',
  /** Failed to parse the Google credential response */
  PARSE_ERROR = 'PARSE_ERROR',
  /** Received an unexpected credential type */
  INVALID_CREDENTIAL_TYPE = 'INVALID_CREDENTIAL_TYPE',
  /** Received an unexpected credential class */
  INVALID_CREDENTIAL = 'INVALID_CREDENTIAL',
  /** No activity available (app not in foreground) */
  NO_ACTIVITY = 'NO_ACTIVITY',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error thrown during Google Sign-In
 */
export interface GoogleSignInError extends Error {
  code: GoogleSignInErrorCode;
}

/**
 * Sign in with Google using Android's Credential Manager API.
 *
 * This function uses the native Credential Manager API which provides:
 * - One-tap sign-in experience
 * - Automatic nonce generation for replay protection
 * - Support for Auth0 token exchange
 *
 * @param webClientId - The Web Client ID from Google Cloud Console.
 *   This is the OAuth 2.0 Client ID of type "Web application".
 *
 * @returns The Google credential with ID token, or `null` if the user cancelled.
 *
 * @throws {GoogleSignInError} If sign-in fails for reasons other than cancellation.
 *
 * @example
 * ```typescript
 * try {
 *   const result = await signInWithGoogle('your-web-client-id.apps.googleusercontent.com');
 *   if (result) {
 *     // User signed in successfully
 *     console.log('Welcome', result.displayName);
 *     console.log('ID Token:', result.idToken);
 *   } else {
 *     // User cancelled
 *     console.log('Sign-in cancelled');
 *   }
 * } catch (error) {
 *   console.error('Sign-in failed:', error.code, error.message);
 * }
 * ```
 */
export async function signInWithGoogle(
  webClientId: string
): Promise<GoogleSignInResult | null> {
  if (Platform.OS !== 'android') {
    throw new Error(
      'signInWithGoogle is only available on Android. Use expo-apple-authentication for iOS.'
    );
  }

  if (!GoogleCredentialModule) {
    throw new Error(
      'GoogleCredentialModule native module not found. ' +
        'Make sure you have run `npx expo prebuild` after adding the plugin.'
    );
  }

  try {
    const result = await GoogleCredentialModule.signIn(webClientId);
    return result as GoogleSignInResult;
  } catch (error: unknown) {
    // Handle cancellation gracefully by returning null
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === GoogleSignInErrorCode.SIGN_IN_CANCELLED
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Check if Google Sign-In via Credential Manager is available.
 *
 * This returns `true` only on Android when the native module is properly loaded.
 * On iOS, this will always return `false` - use `expo-apple-authentication` instead.
 *
 * @returns `true` if Google Sign-In is available, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isGoogleSignInAvailable()) {
 *   // Show Google Sign-In button
 * } else if (Platform.OS === 'ios') {
 *   // Show Apple Sign-In button instead
 * }
 * ```
 */
export function isGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' && !!GoogleCredentialModule;
}

// Re-export plugin types for consumers who need them
export type { GoogleSignInPluginProps } from './withGoogleCredentialManager';

