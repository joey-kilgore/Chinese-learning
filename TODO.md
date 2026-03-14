# TODO

## Next Up

- [x] Persist flagged words to Supabase — wire existing in-memory flag state to `flagged_words` table
- [x] Article history — save generated articles to Supabase `article_history` table, show list on Home screen
- [x] Flashcard mode — quiz flagged words using spaced repetition
- [x] Vocabulary list screen — table of all flagged words with detail modal (due date, repetitions, view counts)
- [x] Article view tracking — increment `article_views` on flagged words when they appear in an opened article
- [x] Flashcard view tracking — increment `flashcard_views` once per card per session (not per "Again")
- [x] Archive word — soft-delete from active study, preserved for future learning-history dashboard
- [x] Practice words toggle — include 5 least-seen flagged words in article generation prompt

## Bugs / Polish

- [x] Fix CORS issue for direct API calls from web/browser builds — Vercel proxy at /api/claude
- [ ] Add error boundary so uncaught errors show a friendly message instead of a blank screen
- [ ] Handle very long article titles overflowing the navigation header

## Features

- [ ] Audio — text-to-speech playback for each sentence using a TTS API
- [ ] More sample articles in `mockData.ts` — cover more HSK levels and topics
- [ ] Topic suggestions per HSK level — beginner-appropriate topics for lower levels
- [ ] Share article — export or share an article as text or PDF

## Infrastructure

- [ ] Set up EAS Build for generating real iOS/Android `.ipa`/`.apk` files (also fixes OAuth redirect URL stability — replaces dynamic `exp://` with stable `chinese-learning://`)
- [ ] Add ESLint + Prettier config
- [ ] Write unit tests for `claudeApi.ts` prompt builder and JSON parser

## Recently Completed

- [x] Google OAuth sign-in via Supabase — session persists across app restarts
- [x] Auth gate — Login screen shown when signed out, main app when signed in
- [x] Sign out button in Settings screen with signed-in email display
- [x] Supabase project setup — `flagged_words` and `article_history` tables with row-level security
- [x] Live Claude API tested end-to-end (USE_MOCK = false, key via .env)
- [x] Dev API key via `.env` / `EXPO_PUBLIC_CLAUDE_API_KEY` — no Settings screen needed during development
- [x] Article JSON written to `last_article.json` on device for easy mock data capture
- [x] Pinyin off by default
- [x] Fix JSON parse errors — strip markdown code fences from API response
- [x] Fix pinyin stacking on multi-char words — syllable splitter with tone-mark fallback
- [x] Word-level tap interaction — first tap reveals pinyin for whole word, second tap shows definition popup
- [x] Word definition popup with flag/star button (words flagged in-memory, ready for persistence)
- [x] Claude prompt generates word-level segmentation per sentence
- [x] Accumulating pinyin reveals with per-sentence clear button
- [x] Ruby pinyin layout and per-character tap interaction
