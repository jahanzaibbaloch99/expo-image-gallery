# Contributing

Contributions are welcome! Please open issues and pull requests on GitHub.

## Development setup

```bash
# 1. Clone
git clone https://github.com/jahanzaibbaloch99/expo-image-gallery.git
cd expo-image-gallery

# 2. Install
npm install

# 3. Build
npm run build

# 4. Test
npm test

# 5. Run the example
cd example
npm install
npx expo start
```

## Commit conventions
We use [Conventional Commits](https://www.conventionalcommits.org/).

## Releasing
Releases are handled automatically by the `publish.yml` GitHub Action when you push a tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```
