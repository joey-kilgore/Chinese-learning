# 可懂 (Kě Dǒng) — Comprehensible Chinese

A React Native (Expo) app that generates Chinese reading articles tailored to your HSK level, following Stephen Krashen's **Comprehensible Input (i+1)** principle. Available on the web and as a native Android/iOS app.

**Live site:** <https://chinese-learning-lovat.vercel.app>

---

## Features

- **HSK 1–9 level selection** — articles use ~90% known vocabulary with a few new i+1 words
- **Word-level tap interaction** — tap any word to reveal pinyin; tap again for a definition popup
- **Flag words for study** — star any word to add it to your personal vocabulary list
- **Vocabulary list** — view all flagged words in a table; tap for details (due date, view counts, example sentence); archive words you've mastered
- **Flashcard mode** — spaced-repetition review of flagged words (SM-2-style intervals)
- **Practice words toggle** — optionally inject your 5 least-practiced flagged words into the next article generation prompt
- **Article history** — recent articles saved to Supabase, accessible from the home screen
- **View tracking** — article and flashcard view counts per word, used to prioritise practice
- **Google Sign-In** — session persists across app restarts; data is per-user in Supabase
- **Web + native** — runs on Vercel (web) and as a native Android/iOS build via EAS

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | React Native + Expo SDK 51 |
| Language | TypeScript |
| Navigation | React Navigation (native stack) |
| Auth | Supabase Auth — Google OAuth |
| Database | Supabase (Postgres + Row Level Security) |
| AI | Anthropic Claude (`claude-haiku-4-5`) via REST |
| Web hosting | Vercel (with `/api/claude` proxy to avoid CORS) |
| Native builds | EAS Build |

---

## Project Structure

```
src/
  contexts/
    AuthContext.tsx       — Google OAuth flow, session management
  screens/
    HomeScreen.tsx        — HSK picker, topic input, generate button, history
    ArticleScreen.tsx     — Article viewer with word-tap, pinyin, translations
    FlashcardScreen.tsx   — Spaced-repetition flashcard session
    VocabListScreen.tsx   — Table of flagged words with detail modal
    SettingsScreen.tsx    — Sign out, API key (production)
    LoginScreen.tsx       — Google sign-in screen
  services/
    claudeApi.ts          — Claude prompt builder + API call
    supabase.ts           — All Supabase queries (auth, articles, flagged words)
    mockData.ts           — Offline sample article data
  styles/
    fonts.ts              — Noto Serif SC font constants
  types/
    index.ts              — Shared TypeScript types
App.tsx                   — Navigation root + font loading
api/
  claude.ts               — Vercel serverless proxy for Claude API (web CORS fix)
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- An [Anthropic API key](https://console.anthropic.com/)
- A Supabase project (see Supabase Setup below)

### Install & Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `w` for web, `i` for iOS simulator, `a` for Android emulator.

### Environment Variables

Create a `.env` file in the project root (never committed):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...
```

`EXPO_PUBLIC_CLAUDE_API_KEY` is a dev convenience so you don't need to enter the key in Settings during development. Leave it empty for production builds.

---

## Supabase Setup

### Tables

Run the following in the Supabase SQL editor:

```sql
-- Articles (shared content store; deduplicated)
create table articles (
  id uuid primary key default gen_random_uuid(),
  article jsonb not null,
  created_at timestamptz default now()
);

-- Per-user article reading history
create table article_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  article_id uuid references articles not null,
  created_at timestamptz default now()
);

-- Per-user flagged vocabulary words
create table flagged_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  chinese text not null,
  pinyin text,
  english text,
  example_sentence text,
  example_sentence_english text,
  -- Spaced repetition (SM-2 style)
  interval integer default 1,
  repetitions integer default 0,
  due_date timestamptz default now(),
  -- View tracking
  article_views integer default 0,
  flashcard_views integer default 0,
  -- Soft delete (preserved for learning history)
  archived boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table article_history enable row level security;
alter table flagged_words enable row level security;

create policy "Users see own history" on article_history
  for all using (auth.uid() = user_id);

create policy "Users manage own words" on flagged_words
  for all using (auth.uid() = user_id);
```

### Google OAuth

1. In the Supabase dashboard go to **Authentication → Providers → Google** and enable it. Copy the **Client ID** and **Client Secret** from your [Google Cloud Console OAuth credentials](https://console.cloud.google.com/).
2. In Google Cloud Console, add Supabase's callback URL as an authorized redirect URI (the URL is shown in the Supabase Google provider settings page).
3. In Supabase **Authentication → URL Configuration**:
   - **Site URL:** `https://chinese-learning-lovat.vercel.app`
   - **Redirect URLs** — add all of the following:

     ```text
     https://chinese-learning-lovat.vercel.app/auth/callback
     http://localhost:8081/auth/callback
     exp://*/*/--/auth/callback
     kedong://auth/callback
     ```

   The `exp://` wildcard covers all Expo Go local dev IPs. `kedong://` is the production native deep-link scheme.

---

## Vercel Deployment

The app deploys automatically on every push to the tracked branch.

### Environment Variables (Vercel dashboard → Project → Settings → Environment Variables)

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_CLAUDE_API_KEY` | Anthropic API key (used server-side by the `/api/claude` proxy) |

The [api/claude.ts](api/claude.ts) serverless function proxies Claude API calls from the browser to avoid CORS. On native, the app calls Anthropic directly.

---

## EAS Build (Native Android / iOS)

The project is configured for [EAS Build](https://docs.expo.dev/build/introduction/).

- **EAS project ID:** `a1807ab6-a814-4a5d-bae2-8763236d3618`
- **Bundle ID / Package:** `io.kedong.app`
- **App scheme:** `kedong` (used for OAuth deep links: `kedong://auth/callback`)

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Development build (installs on device, includes dev menu)
eas build --profile development --platform android

# Preview APK (shareable for internal testing)
eas build --profile preview --platform android

# Production AAB (for Play Store submission)
eas build --profile production --platform android

# iOS (requires Apple Developer account)
eas build --profile production --platform ios
```

### Build Profiles (`eas.json`)

| Profile | Distribution | Android output | Use case |
| --- | --- | --- | --- |
| `development` | internal | APK + dev client | Local dev on a real device |
| `preview` | internal | APK | Shareable test builds |
| `production` | store | AAB | Play Store / App Store submission |

---

## How Comprehensible Input Works

The app prompts Claude to write articles where ~90% of vocabulary comes from HSK levels 1 through your chosen level (known words) and ~10% comes from the next level up (the **i+1 stretch**). This ratio is optimal for language acquisition according to Krashen's Input Hypothesis — you acquire language best when you understand most of the input but are gently challenged by a small amount of new material in context.
