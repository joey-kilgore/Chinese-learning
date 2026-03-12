# TODO

## In Progress
- [ ] Connect live Claude API (disable mock mode — set `USE_MOCK = false` in `src/services/claudeApi.ts`)

## Bugs / Polish
- [ ] Fix CORS issue for direct API calls from web/browser builds — consider a lightweight proxy server or Expo EAS build for native
- [ ] Add error boundary so uncaught errors show a friendly message instead of a blank screen
- [ ] Handle very long article titles overflowing the navigation header

## Features
- [ ] Save/history — store previously generated articles locally so users can revisit them
- [ ] User login / account — sync API key and history across devices (replace local AsyncStorage key)
- [ ] Favorite sentences — let users star individual sentences for review
- [ ] Flashcard mode — quiz the vocabulary list from an article using spaced repetition
- [ ] Audio — text-to-speech playback for each sentence using a TTS API
- [ ] More sample articles in `mockData.ts` — cover more HSK levels and topics
- [ ] Topic suggestions per HSK level — beginner-appropriate topics for lower levels
- [ ] Share article — export or share an article as text or PDF

## Infrastructure
- [ ] Set up EAS Build for generating real iOS/Android `.ipa`/`.apk` files
- [ ] Add ESLint + Prettier config
- [ ] Write unit tests for `claudeApi.ts` prompt builder and JSON parser
