import { Platform } from 'react-native';
import { Article, ArticleLength, HskLevel } from '../types';
import { getMockArticle } from './mockData';
import { fetchRandomArticle } from './supabase';

// Set to true to skip Claude API calls and serve a random saved article from the DB
export const USE_SAVED = false;

// During development, set EXPO_PUBLIC_CLAUDE_API_KEY in a local .env file
// (see .env.example). This is used as a fallback so you don't have to enter
// the key via the Settings screen every time. Has no effect when USE_MOCK = true.
export const DEV_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

// On web, route through the Vercel proxy to avoid CORS; on native, call Anthropic directly.
const CLAUDE_API_URL = Platform.OS === 'web'
  ? '/api/claude'
  : 'https://api.anthropic.com/v1/messages';
const MODEL_STANDARD = 'claude-haiku-4-5';
const MODEL_LONG = 'claude-sonnet-4-6';

const LENGTH_CONFIG: Record<ArticleLength, { sentences: string; label: string }> = {
  short:  { sentences: '8–12',  label: 'short' },
  medium: { sentences: '15–20', label: 'medium-length' },
  long:   { sentences: '25–30', label: 'long' },
};

function buildPrompt(hskLevel: HskLevel, topic: string, length: ArticleLength, practiceWords?: string[]): string {
  const { sentences, label } = LENGTH_CONFIG[length];
  const topicLine = topic.trim()
    ? `The article topic should be: ${topic.trim()}.`
    : 'Choose an interesting everyday topic (e.g. food, weather, family, hobbies, travel).';
  const practiceLine = practiceWords?.length
    ? `The learner is currently studying these words — try to naturally include some of them in the article: ${practiceWords.join('、')}。`
    : '';

  return `You are a Chinese language teacher creating comprehensible input (CI) articles.

Create a ${label} article (${sentences} sentences) for a learner at HSK level ${hskLevel}.

Guidelines:
- Use vocabulary primarily from HSK levels 1-${hskLevel} (known words)
- Introduce 3-6 new words from HSK level ${Math.min(hskLevel + 1, 9)} (the i+1 stretch)
- Keep sentences clear and natural — not textbook-stiff
- Use simple, connected prose (not bullet points)
- ${topicLine}${practiceLine ? `\n- ${practiceLine}` : ''}

Return ONLY a valid JSON object — no markdown, no explanation, just the JSON — in this exact shape:
{
  "title": "Article title in Chinese characters",
  "title_pinyin": "Pinyin for the title with tone numbers or tone marks",
  "title_english": "English translation of the title",
  "sentences": [
    {
      "chinese": "Full Chinese sentence using characters",
      "pinyin": "Pinyin for the sentence with tone marks",
      "english": "Natural English translation",
      "words": [
        {
          "chinese": "word or punctuation mark",
          "pinyin": "pinyin for this word (empty string for punctuation)",
          "english": "concise English gloss for this word (empty string for punctuation)"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "Chinese word (characters)",
      "pinyin": "Pinyin with tone marks",
      "definition": "Clear, concise English definition",
      "hsk_level": 3
    }
  ]
}

For the "words" array: segment each sentence into individual words (Chinese words are often 2-4 characters). Include every punctuation mark (。，！？、：；…) as a separate entry with empty pinyin and empty english. Every character in "chinese" must appear in exactly one word entry.
IMPORTANT: For multi-character words, always separate each syllable with a space in the "pinyin" field. One syllable per character, separated by spaces. Example: 起床 → "qǐ chuáng", NOT "qǐchuáng".`;
}

export async function generateArticle(
  apiKey: string,
  hskLevel: HskLevel,
  topic: string,
  length: ArticleLength = 'short',
  practiceWords?: string[]
): Promise<Article> {
  if (USE_SAVED) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const saved = await fetchRandomArticle(hskLevel);
    if (saved) return saved;
    return getMockArticle(hskLevel, topic); // fallback if DB is empty
  }

  const resolvedKey = apiKey || DEV_API_KEY;
  if (!resolvedKey) {
    throw new Error('No API key provided. Add your Anthropic API key in Settings.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': resolvedKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: length === 'long' ? MODEL_LONG : MODEL_STANDARD,
      max_tokens: length === 'long' ? 16000 : 8192,
      messages: [
        {
          role: 'user',
          content: buildPrompt(hskLevel, topic, length, practiceWords),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[claudeApi] HTTP error', response.status, errorBody);
    if (response.status === 404 && Platform.OS === 'web') {
      throw new Error('API proxy not found. For local web testing, run "vercel dev" instead of "expo start".');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API key in Settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    throw new Error(`API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.content?.[0]?.text;
  const stopReason = data?.stop_reason;
  const usage = data?.usage;

  console.log('[claudeApi] stop_reason:', stopReason);
  console.log('[claudeApi] usage:', JSON.stringify(usage));
  console.log('[claudeApi] response length (chars):', content?.length ?? 0);
  console.log('[claudeApi] response (first 500 chars):', content?.slice(0, 500));
  console.log('[claudeApi] response (last 200 chars):', content?.slice(-200));

  if (stopReason === 'max_tokens') {
    console.error('[claudeApi] Response was truncated — increase max_tokens');
  }

  if (!content) {
    throw new Error('Empty response from Claude API.');
  }

  // Strip markdown code fences Claude sometimes wraps the JSON in
  const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: Omit<Article, 'hsk_level' | 'topic'>;
  try {
    parsed = JSON.parse(stripped);
  } catch (parseErr) {
    console.error('[claudeApi] JSON parse error:', parseErr);
    console.error('[claudeApi] Full response:', content);
    // Last resort: extract the outermost {...} block
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse article from API response.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  const article = {
    ...parsed,
    hsk_level: hskLevel,
    topic: topic.trim() || 'General',
  };

  // Write the full article JSON to a file for easy mock data capture (dev/native only)
  if (__DEV__ && Platform.OS !== 'web') {
    try {
      const { File: EFSFile, Paths } = await import('expo-file-system');
      const file = new EFSFile(Paths.document, 'last_article.json');
      file.write(JSON.stringify(article, null, 2));
      console.log('[claudeApi] Article written to:', file.uri);
    } catch (fileErr) {
      console.warn('[claudeApi] Could not write article to file:', fileErr);
    }
  }

  return article;
}
