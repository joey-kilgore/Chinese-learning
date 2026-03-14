export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Word {
  chinese: string;
  pinyin: string;   // empty string for punctuation
  english: string;  // empty string for punctuation
}

export interface Sentence {
  chinese: string;
  pinyin: string;
  english: string;
  words: Word[];
}

export interface VocabularyItem {
  word: string;
  pinyin: string;
  definition: string;
  hsk_level?: number;
}

export interface Article {
  title: string;
  title_pinyin: string;
  title_english: string;
  hsk_level: HskLevel;
  topic: string;
  sentences: Sentence[];
  vocabulary: VocabularyItem[];
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Article: { article: Article };
  Flashcards: undefined;
  VocabList: undefined;
  Settings: undefined;
};

export interface FlaggedWordRow {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  example_sentence: string | null;
  example_sentence_english: string | null;
  interval: number;
  repetitions: number;
  due_date: string;
  archived: boolean;
  article_views: number;
  flashcard_views: number;
}
