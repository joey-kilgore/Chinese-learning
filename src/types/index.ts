export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Sentence {
  chinese: string;
  pinyin: string;
  english: string;
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
  Home: undefined;
  Article: { article: Article };
  Settings: undefined;
};
