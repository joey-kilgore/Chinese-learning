import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Article, FlaggedWordRow, HskLevel, Sentence, Word } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface ArticleHistoryRow {
  id: string;
  created_at: string;
  article_id: string;
  article: Article;
}

export async function saveArticle(article: Article): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { console.warn('[supabase] saveArticle: no authenticated user'); return; }

  const { data: articleRow, error: articleError } = await supabase
    .from('articles')
    .insert({ article })
    .select('id')
    .single();
  if (articleError) { console.warn('[supabase] saveArticle insert article error:', articleError.message); return; }

  const { error: historyError } = await supabase
    .from('article_history')
    .insert({ user_id: user.id, article_id: articleRow.id });
  if (historyError) console.warn('[supabase] saveArticle insert history error:', historyError.message);
}

export async function fetchRandomArticle(hskLevel?: HskLevel): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('article');
  if (error) { console.warn('[supabase] fetchRandomArticle error:', error.message); return null; }
  if (!data?.length) { console.warn('[supabase] fetchRandomArticle: no articles in DB'); return null; }
  const matches = hskLevel ? data.filter((r: any) => r.article?.hsk_level === hskLevel) : data;
  const pool = matches.length > 0 ? matches : data;
  return pool[Math.floor(Math.random() * pool.length)].article as Article;
}

export async function fetchFlaggedWords(): Promise<Set<string>> {
  const { data, error } = await supabase.from('flagged_words').select('chinese');
  if (error) { console.warn('[supabase] fetchFlaggedWords error:', error.message); return new Set(); }
  return new Set((data ?? []).map((r: any) => r.chinese));
}

export async function flagWord(word: Word, sentence?: Sentence): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('flagged_words').insert({
    user_id: user.id,
    chinese: word.chinese,
    pinyin: word.pinyin,
    english: word.english,
    example_sentence: sentence?.chinese ?? null,
    example_sentence_english: sentence?.english ?? null,
  });
  if (error) console.warn('[supabase] flagWord error:', error.message);
}

export async function fetchDueFlashcards(): Promise<FlaggedWordRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('flagged_words')
    .select('id, chinese, pinyin, english, example_sentence, example_sentence_english, interval, repetitions, due_date')
    .lte('due_date', now)
    .order('due_date', { ascending: true });
  if (error) { console.warn('[supabase] fetchDueFlashcards error:', error.message); return []; }
  return (data ?? []) as FlaggedWordRow[];
}

// Pass/fail spaced repetition: intervals grow as 1→6→15→38→... days (×2.5 each time)
export async function updateFlashcardReview(id: string, passed: boolean): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('flagged_words')
    .select('interval, repetitions')
    .eq('id', id)
    .single();
  if (fetchError || !data) { console.warn('[supabase] updateFlashcardReview fetch error:', fetchError?.message); return; }

  let { interval, repetitions } = data as { interval: number; repetitions: number };

  if (passed) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * 2.5);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  const due = new Date();
  due.setDate(due.getDate() + interval);

  const { error } = await supabase
    .from('flagged_words')
    .update({ interval, repetitions, due_date: due.toISOString() })
    .eq('id', id);
  if (error) console.warn('[supabase] updateFlashcardReview update error:', error.message);
}

export async function unflagWord(chinese: string): Promise<void> {
  const { error } = await supabase.from('flagged_words').delete().eq('chinese', chinese);
  if (error) console.warn('[supabase] unflagWord error:', error.message);
}

export async function fetchArticleHistory(): Promise<ArticleHistoryRow[]> {
  const { data, error } = await supabase
    .from('article_history')
    .select('id, created_at, article_id, articles(article)')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.warn('[supabase] fetchArticleHistory error:', error.message);
    return [];
  }
  return (data as any[]).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    article_id: row.article_id,
    article: row.articles.article,
  }));
}
