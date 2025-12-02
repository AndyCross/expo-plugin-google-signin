# Google Cloud Console Setup

This guide walks you through setting up Google OAuth credentials for use with `expo-plugin-google-signin`.

## Overview

You need a **Web Client ID** from Google Cloud Console. This might seem counterintuitive for a mobile app, but:

- Android's Credential Manager uses the Web Client ID for token validation
- The ID token generated is verified against this Web Client ID
- You do NOT need to configure SHA-1 fingerprints for this to work

## Step-by-Step Setup

### 1. Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Either select an existing project or click **New Project**
4. If creating new, give it a name and click **Create**

### 2. Enable the Required APIs

1. Go to **APIs & Services → Library**
2. Search for and enable:
   - **Google Identity Services** (for Credential Manager)

### 3. Configure OAuth Consent Screen

Before creating credentials, you must configure the consent screen:

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Your app's name
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On the **Scopes** screen, click **Add or Remove Scopes**
7. Add these scopes:
   - `openid`
   - `email`
   - `profile`
8. Click **Save and Continue**
9. On **Test users**, add your email for testing (if in testing mode)
10. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

Now create the Web Client ID:

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Select **Web application** as the application type
4. Give it a name (e.g., "My App Web Client")
5. You can leave **Authorized JavaScript origins** and **Authorized redirect URIs** empty for mobile use
6. Click **Create**
7. **Copy the Client ID** - this is your `webClientId`

The Client ID will look like: `123456789-abcdefgh.apps.googleusercontent.com`

### 5. (Optional) Create Android OAuth Client

While not strictly required for Credential Manager, creating an Android OAuth client can help with debugging:

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Select **Android**
4. Enter your package name (e.g., `com.yourcompany.yourapp`)
5. For SHA-1 fingerprint, run:

```bash
# Debug keystore (for development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android

# For release, use your release keystore
```

6. Copy the SHA-1 fingerprint and paste it
7. Click **Create**

## Finding Your Credentials

After setup, your credentials page should show:

| Name | Type | Client ID |
|------|------|-----------|
| My App Web Client | Web application | `123456789-xxx.apps.googleusercontent.com` |
| My App Android (optional) | Android | `123456789-yyy.apps.googleusercontent.com` |

**Use the Web application Client ID** in your app:

```typescript
const WEB_CLIENT_ID = '123456789-xxx.apps.googleusercontent.com';
```

## Environment Configuration

### Development vs Production

For most apps, you can use the same Web Client ID for both development and production. However, if you want separate tracking:

1. Create two projects in Google Cloud Console
2. Create Web Client IDs in each
3. Use environment variables to switch:

```typescript
// config.ts
export const GOOGLE_WEB_CLIENT_ID = __DEV__
  ? 'dev-client-id.apps.googleusercontent.com'
  : 'prod-client-id.apps.googleusercontent.com';
```

### Expo Constants

You can also use Expo's app.json extra field:

```json
{
  "expo": {
    "extra": {
      "googleWebClientId": "123456789-xxx.apps.googleusercontent.com"
    }
  }
}
```

```typescript
import Constants from 'expo-constants';

const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;
```

## Publishing Your App

### Moving from Testing to Production

If your OAuth consent screen is in "Testing" mode:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Your app will be reviewed by Google
4. Once approved, any Google account can sign in

### Production Checklist

- [ ] OAuth consent screen is published (or set to Internal for Workspace)
- [ ] App name and logos are configured correctly
- [ ] Privacy policy and Terms of Service URLs are added
- [ ] Required scopes are minimal (only request what you need)

## Troubleshooting

### "Sign-in failed" with no specific error

- Verify your Web Client ID is correct
- Ensure OAuth consent screen is configured
- Check that Google Identity Services API is enabled

### "No credential available"

- User may not have a Google account on the device
- Try signing in to a Google account in device Settings first

### Rate Limiting

Google may rate-limit sign-in requests during development. If you see unusual failures:

- Wait a few minutes and try again
- Avoid rapid repeated sign-in attempts in testing

## References

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Identity Services Documentation](https://developers.google.com/identity)
- [Credential Manager Android Docs](https://developer.android.com/identity/sign-in/credential-manager)

