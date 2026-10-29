# Expense Tracker App

A cross-platform mobile expense tracker built with React Native (Expo).

## Features
- Add, edit, and delete expenses
- Categorize expenses and filter by date/category
- Analytics dashboard: pie chart (by category), line chart (trend over time), total spent
- Subscriptions: weekly, monthly or yearly charges, added to your expenses on each billing date (including past ones), with monthly and yearly cost and upcoming charges
- History: monthly totals with change from the previous month and a category breakdown
- Projection: expected spending by month end and for the next two months, from your recent daily average plus scheduled subscription charges
- Data saved on the device, including the chosen language
- Mobile-friendly UI
- 13 languages (English, Chinese, Hindi, Spanish, Arabic, French, Bengali, Portuguese, Russian, Urdu, Indonesian, German, Japanese) with right-to-left layout for Arabic and Urdu; follows the device language, switchable from the 🌐 button
- Currency, numbers and dates formatted for the selected language, with currency taken from the device region
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

### Run tests
```bash
npm test
```

### Project Structure
```
assets/           # App icons and images
.github/workflows/ # CI pipeline for Expo builds
App.js            # App shell: saved state, tabs, expense and language sheets
OverviewView.js   # Totals, category breakdown, trend and transactions
HistoryView.js    # Monthly history and projection
SubscriptionsView.js, SubscriptionSheet.js # Subscription list and editor
theme.js          # Colors and styles
i18n.js           # Translations and locale formatting
storage.js        # Saving and loading data on the device
amount.js         # Amount parsing (tested by amount.test.mjs)
dates.js, subscriptions.js, insights.js, model.js # Dates, charge schedule, history/projection, saved-data checks (tested by *.test.mjs)
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

Feel free to extend the app with authentication, budgets, or more analytics!