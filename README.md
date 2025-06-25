# Expense Tracker App

A cross-platform mobile expense tracker built with React Native (Expo).

## Features
- Add, edit, and delete expenses
- Categorize expenses and filter by date/category
- Analytics dashboard: pie chart (by category), line chart (trend over time), total spent
- Mobile-friendly UI
- GitHub Actions pipeline for iOS and Android builds

## Getting Started

### Install dependencies
```bash
npm install
```

### Run the app
- For Android: `npm run android`
- For iOS: `npm run ios` (requires macOS or use Expo Go)
- For Web: `npm run web`
- Or start the Expo dev server: `npm start`

### Project Structure
```
assets/           # App icons and images
.github/workflows/ # CI pipeline for Expo builds
App.js            # Main app code
app.json          # Expo app config
index.js          # Entry point
package.json      # Dependencies and scripts
```

## CI/CD Pipeline
- On every push or pull request to `main`/`master`, the app is built for both iOS and Android using Expo Application Services (EAS).
- Artifacts are uploaded for download.
- Configure your Expo token as a secret named `EXPO_TOKEN` in your GitHub repo.

See `.github/workflows/expo-build.yml` for details.

---

Feel free to extend the app with persistent storage, authentication, or more analytics!