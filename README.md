# 汉语阅读 — Chinese Reading Generator

A React Native (Expo) mobile app that generates Chinese reading articles tailored to your HSK level, following Stephen Krashen's **Comprehensible Input (i+1)** principle.

## Features

- **HSK 1–9 level selection** — articles use vocabulary you know with a few new words just above your level
- **Pinyin annotations** — toggle on/off above each sentence
- **English translations** — toggle sentence-by-sentence translations
- **Vocabulary list** — tap any new word to see its definition and HSK level
- **Topic selection** — pick from suggestions or type your own topic
- **Powered by Claude** — uses `claude-opus-4-6` for high-quality, natural Chinese prose

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

### API Key Setup

1. Open the app and tap the **⚙** settings icon (top right)
2. Enter your Anthropic API key (starts with `sk-ant-`)
3. Tap **Save API Key**

Your key is stored locally on your device using AsyncStorage and is only ever sent directly to Anthropic's API.

## Project Structure

```
src/
  screens/
    HomeScreen.tsx      — HSK level picker, topic input, generate button
    ArticleScreen.tsx   — Article viewer with pinyin/translation toggles
    SettingsScreen.tsx  — API key management
  services/
    claudeApi.ts        — Claude API integration + prompt engineering
  types/
    index.ts            — TypeScript types
App.tsx                 — Navigation root
```

## How Comprehensible Input Works

The app prompts Claude to write articles where ~90% of the vocabulary is from HSK levels 1 through your chosen level (known words), and ~10% is new vocabulary from the next HSK level up (the **i+1 stretch**). This ratio is optimal for language acquisition according to Krashen's Input Hypothesis.
