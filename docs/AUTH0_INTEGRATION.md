# Auth0 Integration Guide

This guide explains how to use `expo-plugin-google-signin` with Auth0's Native Social Login feature for a seamless authentication flow.

## Overview

The flow works like this:

1. User taps "Sign in with Google" in your app
2. Android's Credential Manager shows the native Google sign-in UI
3. Your app receives a Google ID token (with a nonce for security)
4. Your app exchanges this token with Auth0 for an Auth0 access token
5. Use the Auth0 token for your API calls

## Prerequisites

- Auth0 account with a Native Application configured
- Google Cloud project with OAuth credentials
- This plugin installed and configured

## Auth0 Setup

### 1. Create a Native Application

1. Go to **Auth0 Dashboard → Applications → Applications**
2. Click **Create Application**
3. Select **Native** application type
4. Note your **Client ID**

### 2. Configure Google Social Connection

1. Go to **Authentication → Social → Google**
2. Click **Create Connection** if it doesn't exist
3. Enter your Google OAuth credentials:
   - **Client ID**: Your Web Client ID from Google Cloud Console
   - **Client Secret**: Your Web Client Secret from Google Cloud Console
4. In the **Applications** tab, enable the connection for your Native app

### 3. Enable Token Exchange (Critical!)

Token Exchange is required for native social login:

1. Go to **Applications → APIs**
2. Select your API (or the Auth0 Management API for testing)
3. Under **Settings**, ensure **Allow Offline Access** is enabled if you need refresh tokens

### 4. Configure Device Settings

This step is often missed and causes `invalid_client` errors:

1. Go to **Applications → [Your Native App] → Settings**
2. Scroll to **Advanced Settings**
3. Click **Device Settings** tab
4. Under **Native Social Login**, enable **Google**
5. **Save Changes**

## Implementation

### Basic Token Exchange

```typescript
import { signInWithGoogle } from 'expo-plugin-google-signin';

const AUTH0_DOMAIN = 'your-tenant.auth0.com';
const AUTH0_CLIENT_ID = 'your-native-app-client-id';
const AUTH0_AUDIENCE = 'https://your-api.example.com';
const GOOGLE_WEB_CLIENT_ID = 'your-web-client-id.apps.googleusercontent.com';

async function signInWithAuth0ViaGoogle() {
  // Step 1: Get Google credential
  const googleResult = await signInWithGoogle(GOOGLE_WEB_CLIENT_ID);
  
  if (!googleResult) {
    console.log('User cancelled Google sign-in');
    return null;
  }

  // Step 2: Exchange for Auth0 token
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: googleResult.idToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      client_id: AUTH0_CLIENT_ID,
      audience: AUTH0_AUDIENCE,
      scope: 'openid profile email offline_access',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Auth0 error: ${error.error_description || error.error}`);
  }

  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresIn: tokens.expires_in,
    // Original Google profile info
    googleProfile: {
      email: googleResult.id,
      name: googleResult.displayName,
      picture: googleResult.profilePictureUri,
    },
  };
}
```

### With Error Handling

```typescript
import { signInWithGoogle, GoogleSignInErrorCode } from 'expo-plugin-google-signin';

async function signInWithFullErrorHandling() {
  try {
    const googleResult = await signInWithGoogle(GOOGLE_WEB_CLIENT_ID);
    
    if (!googleResult) {
      return { status: 'cancelled' };
    }

    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token: googleResult.idToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        client_id: AUTH0_CLIENT_ID,
        audience: AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific Auth0 errors
      switch (data.error) {
        case 'invalid_client':
          throw new Error(
            'Auth0 Device Settings may not be configured. ' +
            'Enable Google under Native Social Login in your Auth0 app settings.'
          );
        case 'invalid_grant':
          throw new Error(
            'Token exchange failed. Ensure Google social connection is configured in Auth0.'
          );
        default:
          throw new Error(data.error_description || data.error);
      }
    }

    return { status: 'success', tokens: data };
    
  } catch (error: any) {
    // Handle Google sign-in errors
    switch (error.code) {
      case GoogleSignInErrorCode.NO_CREDENTIAL:
        return { 
          status: 'error', 
          message: 'No Google account found. Please add a Google account to your device.' 
        };
      case GoogleSignInErrorCode.CREDENTIAL_ERROR:
        return { 
          status: 'error', 
          message: 'Google sign-in failed. Please try again.' 
        };
      default:
        return { status: 'error', message: error.message };
    }
  }
}
```

### Using with a Custom Auth Hook

```typescript
// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { signInWithGoogle, isGoogleSignInAvailable } from 'expo-plugin-google-signin';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email: string; name: string | null } | null;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
  });

  const signIn = useCallback(async () => {
    if (!isGoogleSignInAvailable()) {
      setState(s => ({ ...s, error: 'Google Sign-In not available' }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const googleResult = await signInWithGoogle(GOOGLE_WEB_CLIENT_ID);
      if (!googleResult) {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token: googleResult.idToken,
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          client_id: AUTH0_CLIENT_ID,
          audience: AUTH0_AUDIENCE,
          scope: 'openid profile email offline_access',
        }),
      });

      const tokens = await response.json();
      
      if (!response.ok) {
        throw new Error(tokens.error_description || 'Auth0 token exchange failed');
      }

      // Store tokens securely
      await SecureStore.setItemAsync('access_token', tokens.access_token);
      if (tokens.refresh_token) {
        await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
      }

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          email: googleResult.id,
          name: googleResult.displayName,
        },
        error: null,
      });
    } catch (error: any) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: error.message,
      }));
    }
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, []);

  return { ...state, signIn, signOut };
}
```

## Troubleshooting Auth0 Issues

### `invalid_client` Error

- **Cause**: Device Settings not configured
- **Fix**: In Auth0 Dashboard, go to your app's Advanced Settings → Device Settings → Enable Google

### `invalid_grant` Error

- **Cause**: Google social connection not configured or not enabled for app
- **Fix**: Set up Google social connection in Auth0 and enable it for your application

### `unauthorized_client` Error

- **Cause**: Token Exchange grant not enabled
- **Fix**: Ensure your Auth0 application allows the token-exchange grant type

### Token Has Wrong Audience

- **Cause**: Audience parameter mismatch
- **Fix**: Ensure the `audience` in your token exchange request matches your Auth0 API identifier

## Security Considerations

1. **Never expose your Client Secret** in the mobile app - only use the Client ID
2. **Store tokens securely** using `expo-secure-store` or similar
3. **Use HTTPS** for all Auth0 API calls
4. **Validate tokens server-side** before trusting user identity

## References

- [Auth0 Native Social Login Documentation](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google-native)
- [Auth0 Token Exchange](https://auth0.com/docs/get-started/authentication-and-authorization-flow/token-exchange-flow)

