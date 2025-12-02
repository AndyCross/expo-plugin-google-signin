# Contributing to expo-plugin-google-signin

First off, thanks for taking the time to contribute! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Expo SDK version**
- **React Native version**
- **Android API level**
- **Device/emulator details**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages and stack traces**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear and descriptive title**
- **Detailed description** of the proposed functionality
- **Why this would be useful** to most users
- **Possible implementation approach** (optional)

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Run `npm install` to install dependencies
3. Make your changes
4. Run `npm run build` to ensure TypeScript compiles
5. Test your changes with the example app
6. Update documentation if needed
7. Submit your pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/expo-plugin-google-signin.git
cd expo-plugin-google-signin

# Install dependencies
npm install

# Build the plugin
npm run build

# Test with the example app
cd example
npm install
npx expo prebuild --clean
npx expo run:android
```

## Code Style

- Use TypeScript for all source files
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep commits focused and atomic

## Testing Changes

To test your plugin changes locally:

1. Build the plugin: `npm run build`
2. In the example app, the plugin is linked via `file:..`
3. Run `npx expo prebuild --clean` after plugin changes
4. Test on Android device/emulator

## Questions?

Feel free to open an issue for any questions about contributing.

