import { Article, HskLevel } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-6';

function buildPrompt(hskLevel: HskLevel, topic: string): string {
  const topicLine = topic.trim()
    ? `The article topic should be: ${topic.trim()}.`
    : 'Choose an interesting everyday topic (e.g. food, weather, family, hobbies, travel).';

  return `You are a Chinese language teacher creating comprehensible input (CI) articles.

Create a short article (8-12 sentences) for a learner at HSK level ${hskLevel}.

Guidelines:
- Use vocabulary primarily from HSK levels 1-${hskLevel} (known words)
- Introduce 3-6 new words from HSK level ${Math.min(hskLevel + 1, 9)} (the i+1 stretch)
- Keep sentences clear and natural — not textbook-stiff
- Use simple, connected prose (not bullet points)
- ${topicLine}

Return ONLY a valid JSON object — no markdown, no explanation, just the JSON — in this exact shape:
{
  "title": "Article title in Chinese characters",
  "title_pinyin": "Pinyin for the title with tone numbers or tone marks",
  "title_english": "English translation of the title",
  "sentences": [
    {
      "chinese": "Full Chinese sentence using characters",
      "pinyin": "Pinyin for the sentence with tone marks",
      "english": "Natural English translation"
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
}`;
}

export async function generateArticle(
  apiKey: string,
  hskLevel: HskLevel,
  topic: string
): Promise<Article> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: buildPrompt(hskLevel, topic),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
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

  if (!content) {
    throw new Error('Empty response from Claude API.');
  }

  let parsed: Omit<Article, 'hsk_level' | 'topic'>;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Try extracting JSON from the response in case Claude added extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse article from API response.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  return {
    ...parsed,
    hsk_level: hskLevel,
    topic: topic.trim() || 'General',
  };
}
