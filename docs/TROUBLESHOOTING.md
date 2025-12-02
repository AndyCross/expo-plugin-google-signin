# Troubleshooting Guide

Common issues and solutions when using `expo-plugin-google-signin`.

## Installation & Setup Issues

### "GoogleCredentialModule native module not found"

**Cause**: The native module hasn't been built into your app.

**Solutions**:

1. Make sure you've added the plugin to `app.json`:
   ```json
   {
     "plugins": ["expo-plugin-google-signin"]
   }
   ```

2. Rebuild your app completely:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

3. If using EAS Build, ensure the plugin is in your dependencies and rebuild.

### Plugin not generating Kotlin files

**Cause**: The prebuild step may not have run correctly.

**Solutions**:

1. Delete the `android` folder and rebuild:
   ```bash
   rm -rf android
   npx expo prebuild --platform android
   ```

2. Check the prebuild output for any error messages from `[expo-plugin-google-signin]`

3. Verify the plugin is listed in `package.json` dependencies

## Sign-In Errors

### `SIGN_IN_CANCELLED`

**Cause**: User closed the sign-in dialog.

**This is normal behavior** - handle it gracefully:

```typescript
const result = await signInWithGoogle(webClientId);
if (!result) {
  // User cancelled - don't show an error
  return;
}
```

### `NO_CREDENTIAL`

**Cause**: No Google account is available on the device.

**Solutions**:

1. Ensure a Google account is signed in on the device (Settings → Accounts)
2. On emulator, sign into Google Play Store
3. The message may also appear if Google Play Services is missing or outdated

**User-facing message suggestion**:
> "Please add a Google account to your device in Settings, then try again."

### `CREDENTIAL_ERROR`

**Cause**: General Credential Manager failure.

**Common causes**:

1. **Invalid Web Client ID**: Double-check your Client ID is correct and from a Web Application type OAuth client
2. **Google Play Services outdated**: Update Google Play Services on the device
3. **Network issues**: Ensure the device has internet connectivity

**Debug steps**:

```typescript
try {
  await signInWithGoogle(webClientId);
} catch (error) {
  console.error('Full error:', JSON.stringify(error, null, 2));
  // Check error.message for more details
}
```

### `NO_ACTIVITY`

**Cause**: The app isn't in the foreground when sign-in was requested.

**Solutions**:

1. Only call `signInWithGoogle()` from a user interaction (button press)
2. Don't call it from `useEffect` on app startup
3. Ensure your app is fully mounted before calling

## Configuration Issues

### Wrong package name in generated files

**Cause**: `androidPackage` option not set correctly.

**Solution**: Explicitly set the package name in `app.json`:

```json
{
  "plugins": [
    ["expo-plugin-google-signin", {
      "androidPackage": "com.yourcompany.yourapp"
    }]
  ]
}
```

Then rebuild:
```bash
npx expo prebuild --clean
```

### Build fails with "duplicate class" errors

**Cause**: Conflicting Credential Manager dependencies.

**Solution**: Check if another library is including Credential Manager with a different version. You may need to exclude it or align versions in `android/app/build.gradle`.

## Auth0-Specific Issues

### `invalid_client` from Auth0

**Cause**: Native Social Login not configured in Auth0.

**Solution**:
1. Go to Auth0 Dashboard → Applications → Your App
2. Scroll to Advanced Settings → Device Settings
3. Enable **Google** under Native Social Login
4. Save Changes

### `invalid_grant` from Auth0

**Cause**: Token exchange not working.

**Possible causes**:
1. Google social connection not set up in Auth0
2. Social connection not enabled for your application
3. Wrong `subject_token_type` in the request

**Verify your token exchange request**:
```typescript
{
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  subject_token: googleResult.idToken,
  subject_token_type: 'urn:ietf:params:oauth:token-type:id_token', // Must be this
  client_id: AUTH0_CLIENT_ID,
  // ...
}
```

### Token works once then fails

**Cause**: ID tokens are single-use for token exchange.

**Solution**: Always get a fresh Google token before each Auth0 token exchange. Don't cache the Google ID token.

## Emulator Issues

### Sign-in doesn't work on emulator

**Solutions**:

1. Use an emulator image with Google Play Services (Google APIs or Google Play)
2. Sign into a Google account in the emulator
3. Update Google Play Services in the emulator

**Recommended emulator setup**:
- Target: Google APIs or Google Play
- API Level: 30+
- Make sure to sign into Google account

### "Google Play Services is updating"

**Solution**: Wait for the update to complete, or restart the emulator.

## Debugging Tips

### Enable verbose logging

Add logging around your sign-in call:

```typescript
console.log('Starting Google sign-in...');
console.log('Web Client ID:', webClientId);
console.log('Is available:', isGoogleSignInAvailable());

try {
  const result = await signInWithGoogle(webClientId);
  console.log('Sign-in result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Sign-in error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}
```

### Check Android logs

Use `adb logcat` to see native logs:

```bash
adb logcat | grep -i "credential\|google"
```

### Verify the native module is loaded

```typescript
import { NativeModules } from 'react-native';
console.log('GoogleCredentialModule:', NativeModules.GoogleCredentialModule);
```

## Getting Help

If you're still stuck:

1. Check [existing GitHub issues](https://github.com/AndyCross/expo-plugin-google-signin/issues)
2. Create a new issue with:
   - Expo SDK version
   - React Native version
   - Android API level
   - Full error message/stack trace
   - Minimal reproduction steps

