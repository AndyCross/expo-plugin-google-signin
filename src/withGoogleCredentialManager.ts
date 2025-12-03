/**
 * Expo Config Plugin: Google Credential Manager
 *
 * This plugin adds the native Android module for Google Sign-In
 * using Credential Manager with nonce support for Auth0.
 *
 * Usage in app.json:
 * {
 *   "plugins": [
 *     ["expo-plugin-google-signin", { "androidPackage": "com.myapp" }]
 *   ]
 * }
 */

import {
  ConfigPlugin,
  withDangerousMod,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

export interface GoogleSignInPluginProps {
  /**
   * The Android package name for your app (e.g., "com.myapp").
   * This is used to generate the native Kotlin module with the correct package.
   * If not provided, defaults to the app's package name from the Expo config.
   */
  androidPackage?: string;
}

/**
 * Generate the Kotlin code for the native module
 */
function generateGoogleCredentialModuleKt(packageName: string): string {
  return `package ${packageName}

import android.app.Activity
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

class GoogleCredentialModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "GoogleCredentialModule"

    @ReactMethod
    fun signIn(webClientId: String, promise: Promise) {
        val activity: Activity? = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        // Generate a nonce for token replay protection (required by Auth0)
        val nonce = UUID.randomUUID().toString()

        // Build the Google ID option with nonce
        val googleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(webClientId)
            .setNonce(nonce)
            .setFilterByAuthorizedAccounts(false)
            .build()

        // Build the credential request
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        // Create credential manager and make the request
        val credentialManager = CredentialManager.create(activity as Context)

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = activity as Context
                )
                handleSignInResult(result, promise)
            } catch (e: GetCredentialCancellationException) {
                promise.reject("SIGN_IN_CANCELLED", "User cancelled the sign-in")
            } catch (e: NoCredentialException) {
                promise.reject("NO_CREDENTIAL", "No credential available: \${e.message}")
            } catch (e: GetCredentialException) {
                promise.reject("CREDENTIAL_ERROR", "Credential error: \${e.message}")
            } catch (e: Exception) {
                promise.reject("UNKNOWN_ERROR", "Unknown error: \${e.message}")
            }
        }
    }

    private fun handleSignInResult(result: GetCredentialResponse, promise: Promise) {
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        
                        val response = Arguments.createMap().apply {
                            putString("idToken", googleCredential.idToken)
                            putString("id", googleCredential.id)
                            putString("displayName", googleCredential.displayName)
                            putString("givenName", googleCredential.givenName)
                            putString("familyName", googleCredential.familyName)
                            putString("profilePictureUri", googleCredential.profilePictureUri?.toString())
                        }
                        
                        promise.resolve(response)
                    } catch (e: Exception) {
                        promise.reject("PARSE_ERROR", "Failed to parse Google credential: \${e.message}")
                    }
                } else {
                    promise.reject("INVALID_CREDENTIAL_TYPE", "Unexpected credential type: \${credential.type}")
                }
            }
            else -> {
                promise.reject("INVALID_CREDENTIAL", "Unexpected credential class: \${credential.javaClass.name}")
            }
        }
    }
}
`;
}

/**
 * Generate the Kotlin code for the React Native package
 */
function generateGoogleCredentialPackageKt(packageName: string): string {
  return `package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class GoogleCredentialPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(GoogleCredentialModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;
}

/**
 * Convert package name to directory path (e.g., "com.myapp" -> "com/myapp")
 */
function packageToPath(packageName: string): string {
  return packageName.replace(/\./g, '/');
}

/**
 * Add Credential Manager dependencies to build.gradle
 */
const withCredentialManagerDependencies: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'build.gradle'
      );

      let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');

      // Check if dependencies are already added
      if (buildGradle.includes('androidx.credentials:credentials')) {
        console.log('[expo-plugin-google-signin] Dependencies already present');
        return config;
      }

      // Add dependencies after react-android
      const dependencyToAdd = `
    // Google Sign-In via Credential Manager (expo-plugin-google-signin)
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
`;

      buildGradle = buildGradle.replace(
        'implementation("com.facebook.react:react-android")',
        `implementation("com.facebook.react:react-android")${dependencyToAdd}`
      );

      fs.writeFileSync(buildGradlePath, buildGradle);
      console.log('[expo-plugin-google-signin] Added dependencies to build.gradle');

      return config;
    },
  ]);
};

/**
 * Create the native module Kotlin files
 */
function withCredentialManagerFiles(
  config: Parameters<ConfigPlugin>[0],
  androidPackage: string
): ReturnType<ConfigPlugin> {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packagePath = packageToPath(androidPackage);
      const packageDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      // Ensure directory exists
      fs.mkdirSync(packageDir, { recursive: true });

      // Write the module file
      const modulePath = path.join(packageDir, 'GoogleCredentialModule.kt');
      fs.writeFileSync(modulePath, generateGoogleCredentialModuleKt(androidPackage));
      console.log('[expo-plugin-google-signin] Created GoogleCredentialModule.kt');

      // Write the package file
      const packageFilePath = path.join(packageDir, 'GoogleCredentialPackage.kt');
      fs.writeFileSync(packageFilePath, generateGoogleCredentialPackageKt(androidPackage));
      console.log('[expo-plugin-google-signin] Created GoogleCredentialPackage.kt');

      return config;
    },
  ]);
}

/**
 * Register the package in MainApplication.kt
 */
function withCredentialManagerMainApplication(
  config: Parameters<ConfigPlugin>[0],
  androidPackage: string
): ReturnType<ConfigPlugin> {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packagePath = packageToPath(androidPackage);
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'MainApplication.kt'
      );

      if (!fs.existsSync(mainAppPath)) {
        console.warn(
          `[expo-plugin-google-signin] MainApplication.kt not found at expected path: ${mainAppPath}`
        );
        return config;
      }

      let mainApp = fs.readFileSync(mainAppPath, 'utf-8');

      // Check if already registered
      if (mainApp.includes('GoogleCredentialPackage')) {
        console.log('[expo-plugin-google-signin] Package already registered');
        return config;
      }

      // Add the package to getPackages()
      mainApp = mainApp.replace(
        /PackageList\(this\)\.packages\.apply\s*\{[^}]*\}/,
        `PackageList(this).packages.apply {
              // Google Sign-In via Credential Manager (expo-plugin-google-signin)
              add(GoogleCredentialPackage())
            }`
      );

      fs.writeFileSync(mainAppPath, mainApp);
      console.log('[expo-plugin-google-signin] Registered package in MainApplication.kt');

      return config;
    },
  ]);
}

/**
 * Main plugin export
 *
 * @param config - Expo config
 * @param props - Plugin properties
 * @returns Modified config
 */
const withGoogleCredentialManager: ConfigPlugin<GoogleSignInPluginProps | void> = (
  config,
  props
) => {
  // Get the Android package name from props or fall back to the app's package
  const androidPackage =
    props?.androidPackage || config.android?.package || 'com.app';

  console.log(`[expo-plugin-google-signin] Using Android package: ${androidPackage}`);

  config = withCredentialManagerDependencies(config);
  config = withCredentialManagerFiles(config, androidPackage);
  config = withCredentialManagerMainApplication(config, androidPackage);

  return config;
};

export default withGoogleCredentialManager;

