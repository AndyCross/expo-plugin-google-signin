# Publishing Guide

This package uses GitHub Actions for automated publishing to npm.

## How It Works

1. **CI runs on every PR** - Builds and validates the package
2. **Release Drafter** - Automatically creates draft releases from merged PRs
3. **Publish on Release** - When you publish a GitHub release, it automatically publishes to npm

## Initial Setup (One-time)

### 1. Create npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) and sign in
2. Click your profile → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (for CI/CD)
5. Copy the token

### 2. Add npm Token to GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click **Add secret**

### 3. Update package.json

Update the repository URL in `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/expo-plugin-google-signin"
  }
}
```

## Publishing a New Version

### Option 1: Using GitHub Releases (Recommended)

1. Go to your repo on GitHub
2. Click **Releases** → **Draft a new release** (or edit the auto-drafted release)
3. Choose a tag (e.g., `v1.0.1`) - this will be created
4. Set the release title (e.g., `v1.0.1`)
5. Add release notes (or use the auto-generated ones)
6. Click **Publish release**

The GitHub Action will automatically:
- Build the package
- Publish to npm with the version in `package.json`

### Option 2: Manual Publishing

If you need to publish manually:

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Build
npm run build

# Publish
npm publish --access public

# Push the version commit and tag
git push && git push --tags
```

## Version Bumping

Before creating a release, update the version in `package.json`:

```bash
# Patch release (1.0.0 → 1.0.1) - bug fixes
npm version patch

# Minor release (1.0.0 → 1.1.0) - new features
npm version minor

# Major release (1.0.0 → 2.0.0) - breaking changes
npm version major
```

This will:
1. Update `package.json`
2. Create a git commit
3. Create a git tag

Then push and create the GitHub release.

## Verifying Publication

After publishing:

1. Check [npmjs.com/package/expo-plugin-google-signin](https://www.npmjs.com/package/expo-plugin-google-signin)
2. Test installation: `npm install expo-plugin-google-signin`

## Troubleshooting

### "npm ERR! 403 Forbidden"

- Check that `NPM_TOKEN` secret is set correctly
- Ensure the token has publish permissions
- The package name might be taken - try a scoped name like `@yourorg/expo-plugin-google-signin`

### "npm ERR! 402 Payment Required"

- For scoped packages, add `--access public` (already in our workflow)

### Build Fails

- Check the CI workflow logs
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to debug

