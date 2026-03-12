import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList, VocabularyItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

// ─── Parsing ────────────────────────────────────────────────────────────────

const PUNCT_RE = /[。，！？、：；—…""''（）【】《》.,!?;:]/;

interface Token {
  char: string;
  syllable: string; // empty for punctuation
  isPunct: boolean;
}

/**
 * Splits a sentence into character+syllable pairs.
 * One Chinese character always maps to exactly one space-separated pinyin syllable.
 * Punctuation characters are given an empty syllable and marked as non-interactive.
 */
function parseTokens(chinese: string, pinyin: string): Token[] {
  const chars = Array.from(chinese);
  // Strip trailing sentence-final punctuation from the pinyin string before splitting
  const syllables = pinyin.replace(/[.,!?。，！？]$/, '').trim().split(/\s+/);
  let sylIdx = 0;
  return chars.map((char) => {
    const isPunct = PUNCT_RE.test(char);
    return {
      char,
      syllable: isPunct ? '' : (syllables[sylIdx++] ?? ''),
      isPunct,
    };
  });
}

// ─── State types ─────────────────────────────────────────────────────────────

type ActiveWord = { sentenceIdx: number; charIdx: number; stage: 1 | 2 } | null;

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ArticleScreen({ route }: Props) {
  const { article } = route.params;
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWord, setActiveWord] = useState<ActiveWord>(null);
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);

  function handleCharPress(sentenceIdx: number, charIdx: number) {
    if (
      activeWord?.sentenceIdx === sentenceIdx &&
      activeWord?.charIdx === charIdx
    ) {
      // Same character tapped again: advance stage 1 → 2, or clear at stage 2
      setActiveWord(
        activeWord.stage === 1
          ? { sentenceIdx, charIdx, stage: 2 }
          : null
      );
    } else {
      // New character tapped: start at stage 1
      setActiveWord({ sentenceIdx, charIdx, stage: 1 });
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Global toggle controls */}
      <View style={styles.toggleRow}>
        <ToggleButton
          label="Pinyin"
          active={showPinyin}
          onPress={() => setShowPinyin((v) => !v)}
        />
        <ToggleButton
          label="Translation"
          active={showTranslation}
          onPress={() => setShowTranslation((v) => !v)}
        />
      </View>

      {/* Tap hint */}
      <Text style={styles.hint}>
        Tap a character for pinyin · tap again for translation
      </Text>

      {/* Title */}
      <View style={styles.titleBlock}>
        {showPinyin && (
          <Text style={styles.titlePinyin}>{article.title_pinyin}</Text>
        )}
        <Text style={styles.titleChinese}>{article.title}</Text>
        {showTranslation && (
          <Text style={styles.titleEnglish}>{article.title_english}</Text>
        )}
        <View style={styles.metaBadgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>HSK {article.hsk_level}</Text>
          </View>
          {article.topic !== 'General' && (
            <View style={[styles.badge, styles.badgeTopic]}>
              <Text style={[styles.badgeText, styles.badgeTopicText]}>
                {article.topic}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Article body */}
      <View style={styles.articleBody}>
        {article.sentences.map((sentence, sentenceIdx) => {
          const tokens = parseTokens(sentence.chinese, sentence.pinyin);
          const isActiveSentence = activeWord?.sentenceIdx === sentenceIdx;
          const showSentenceTranslation =
            showTranslation || (isActiveSentence && activeWord?.stage === 2);

          return (
            <View
              key={sentenceIdx}
              style={[
                styles.sentenceBlock,
                sentenceIdx === article.sentences.length - 1 && styles.sentenceBlockLast,
              ]}
            >
              {/* Ruby text row */}
              <View style={styles.rubyRow}>
                {tokens.map((token, charIdx) => {
                  const isThisWordActive =
                    isActiveSentence && activeWord?.charIdx === charIdx;
                  // Show pinyin for a char if: global toggle ON, or this specific char is tapped
                  const pinyinOpacity =
                    showPinyin || (isThisWordActive && !token.isPunct) ? 1 : 0;

                  if (token.isPunct) {
                    return (
                      <View key={charIdx} style={styles.charUnit}>
                        {/* Spacer keeps punct row same height as interactive chars */}
                        <Text style={[styles.syllable, { opacity: 0 }]}>
                          {' '}
                        </Text>
                        <Text style={styles.punctChar}>{token.char}</Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={charIdx}
                      style={styles.charUnit}
                      onPress={() => handleCharPress(sentenceIdx, charIdx)}
                      activeOpacity={0.5}
                    >
                      <Text
                        style={[styles.syllable, { opacity: pinyinOpacity }]}
                        numberOfLines={1}
                      >
                        {token.syllable}
                      </Text>
                      <Text
                        style={[
                          styles.chineseChar,
                          isThisWordActive && styles.chineseCharActive,
                        ]}
                      >
                        {token.char}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sentence translation (appears on stage 2 or global toggle) */}
              {showSentenceTranslation && (
                <Text style={styles.sentenceEnglish}>{sentence.english}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Vocabulary list */}
      {article.vocabulary.length > 0 && (
        <View style={styles.vocabSection}>
          <Text style={styles.vocabHeader}>Vocabulary</Text>
          <Text style={styles.vocabSubheader}>
            {article.vocabulary.length} new word
            {article.vocabulary.length !== 1 ? 's' : ''} in this article
          </Text>
          {article.vocabulary.map((item: VocabularyItem) => (
            <VocabCard
              key={item.word}
              item={item}
              expanded={expandedVocab === item.word}
              onToggle={() =>
                setExpandedVocab(expandedVocab === item.word ? null : item.word)
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToggleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggle, active && styles.toggleActive]}
      onPress={onPress}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function VocabCard({
  item,
  expanded,
  onToggle,
}: {
  item: VocabularyItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.vocabCard} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.vocabCardHeader}>
        <View style={styles.vocabWordGroup}>
          <Text style={styles.vocabWord}>{item.word}</Text>
          <Text style={styles.vocabPinyin}>{item.pinyin}</Text>
        </View>
        <View style={styles.vocabRight}>
          {item.hsk_level && (
            <View style={styles.vocabBadge}>
              <Text style={styles.vocabBadgeText}>HSK {item.hsk_level}</Text>
            </View>
          )}
          <Text style={styles.vocabChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>
      {expanded && (
        <Text style={styles.vocabDefinition}>{item.definition}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CHAR_SIZE = 26;
const SYLLABLE_SIZE = 11;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 48,
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggle: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  toggleActive: {
    borderColor: '#c0392b',
    backgroundColor: '#fff0ee',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#c0392b',
  },

  // Hint
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginTop: -4,
  },

  // Title block
  titleBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  titlePinyin: {
    fontSize: 13,
    color: '#c0392b',
    letterSpacing: 0.3,
  },
  titleChinese: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  titleEnglish: {
    fontSize: 15,
    color: '#555',
    fontStyle: 'italic',
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    borderRadius: 20,
    backgroundColor: '#c0392b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeTopic: {
    backgroundColor: '#eaf0fb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  badgeTopicText: {
    color: '#2c5fad',
  },

  // Article body
  articleBody: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sentenceBlock: {
    paddingBottom: 12,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  sentenceBlockLast: {
    borderBottomWidth: 0,
  },

  // Ruby text
  rubyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  charUnit: {
    alignItems: 'center',
    marginHorizontal: 1,
    marginBottom: 4,
  },
  syllable: {
    fontSize: SYLLABLE_SIZE,
    color: '#c0392b',
    textAlign: 'center',
    // min width so the char doesn't collapse narrower than its pinyin
    minWidth: CHAR_SIZE,
    lineHeight: SYLLABLE_SIZE + 3,
  },
  chineseChar: {
    fontSize: CHAR_SIZE,
    color: '#1a1a1a',
    lineHeight: CHAR_SIZE + 4,
    textAlign: 'center',
    minWidth: CHAR_SIZE,
  },
  chineseCharActive: {
    color: '#c0392b',
  },
  punctChar: {
    fontSize: CHAR_SIZE,
    color: '#1a1a1a',
    lineHeight: CHAR_SIZE + 4,
  },
  sentenceEnglish: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 6,
  },

  // Vocabulary
  vocabSection: {
    gap: 10,
  },
  vocabHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  vocabSubheader: {
    fontSize: 13,
    color: '#888',
    marginTop: -4,
  },
  vocabCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  vocabCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vocabWordGroup: {
    gap: 2,
  },
  vocabWord: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  vocabPinyin: {
    fontSize: 13,
    color: '#c0392b',
  },
  vocabRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabBadge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vocabBadgeText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  vocabChevron: {
    fontSize: 11,
    color: '#aaa',
  },
  vocabDefinition: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 2,
  },
});
