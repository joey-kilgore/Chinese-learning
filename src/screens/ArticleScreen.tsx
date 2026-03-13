import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList, VocabularyItem, Word } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

// ─── Parsing ────────────────────────────────────────────────────────────────

interface Token {
  char: string;
  syllable: string;
  isPunct: boolean;
  wordIdx: number; // index into the sentence's words array; -1 for punctuation
  word: Word | null;
}

/**
 * Expands a sentence's word array into flat character tokens.
 * Each character in a multi-character word gets the same wordIdx so that
 * tapping any character in the word triggers a word-level action.
 * Punctuation words (pinyin === '') produce tokens with isPunct = true.
 */
function parseWordTokens(words: Word[]): Token[] {
  const tokens: Token[] = [];
  for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
    const word = words[wordIdx];
    const isPunctWord = word.pinyin === '';
    const chars = Array.from(word.chinese);
    const syllables = isPunctWord ? [] : word.pinyin.split(/\s+/);

    for (let i = 0; i < chars.length; i++) {
      tokens.push({
        char: chars[i],
        syllable: isPunctWord ? '' : (syllables[i] ?? ''),
        isPunct: isPunctWord,
        wordIdx: isPunctWord ? -1 : wordIdx,
        word: isPunctWord ? null : word,
      });
    }
  }
  return tokens;
}

// ─── State types ─────────────────────────────────────────────────────────────

// revealedPinyin[sentenceIdx] = Set of wordIdx whose pinyin is visible
type PinyinMap = Record<number, Set<number>>;

interface PopupState {
  word: Word;
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ArticleScreen({ route }: Props) {
  const { article } = route.params;
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  // Per-word pinyin accumulates as you tap
  const [revealedPinyin, setRevealedPinyin] = useState<PinyinMap>({});
  // Per-sentence translation
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(new Set());
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);
  // Word definition popup
  const [popup, setPopup] = useState<PopupState | null>(null);
  // Words flagged for flashcard review
  const [flaggedWords, setFlaggedWords] = useState<Set<string>>(new Set());

  function handleCharPress(sentenceIdx: number, wordIdx: number, word: Word) {
    const alreadyRevealed = revealedPinyin[sentenceIdx]?.has(wordIdx) ?? false;

    if (alreadyRevealed) {
      // Second tap on a revealed word → show definition popup
      setPopup({ word });
    } else {
      // First tap → reveal pinyin for the whole word
      setRevealedPinyin((prev) => {
        const existing = prev[sentenceIdx] ? new Set(prev[sentenceIdx]) : new Set<number>();
        existing.add(wordIdx);
        return { ...prev, [sentenceIdx]: existing };
      });
    }
  }

  function handleClearSentence(sentenceIdx: number) {
    setRevealedPinyin((prev) => {
      const next = { ...prev };
      delete next[sentenceIdx];
      return next;
    });
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      next.delete(sentenceIdx);
      return next;
    });
  }

  function hasSentenceNotes(sentenceIdx: number): boolean {
    return (
      (revealedPinyin[sentenceIdx]?.size ?? 0) > 0 ||
      revealedTranslations.has(sentenceIdx)
    );
  }

  function handleToggleFlag(chinese: string) {
    setFlaggedWords((prev) => {
      const next = new Set(prev);
      if (next.has(chinese)) {
        next.delete(chinese);
      } else {
        next.add(chinese);
      }
      return next;
    });
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
        Tap a word to reveal pinyin · tap again for definition
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
          const tokens = parseWordTokens(sentence.words);
          const sentenceHasNotes = hasSentenceNotes(sentenceIdx);
          const showSentenceTranslation =
            showTranslation || revealedTranslations.has(sentenceIdx);

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
                {tokens.map((token, tokenIdx) => {
                  const isRevealed =
                    !token.isPunct &&
                    (revealedPinyin[sentenceIdx]?.has(token.wordIdx) ?? false);
                  const pinyinOpacity =
                    showPinyin || isRevealed ? 1 : 0;

                  if (token.isPunct) {
                    return (
                      <View key={tokenIdx} style={styles.charUnit}>
                        <Text style={[styles.syllable, { opacity: 0 }]}>{' '}</Text>
                        <Text style={styles.punctChar}>{token.char}</Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={tokenIdx}
                      style={styles.charUnit}
                      onPress={() => handleCharPress(sentenceIdx, token.wordIdx, token.word!)}
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
                          isRevealed && styles.chineseCharRevealed,
                        ]}
                      >
                        {token.char}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Clear notes button */}
              {sentenceHasNotes && (
                <View style={styles.clearRow}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => handleClearSentence(sentenceIdx)}
                  >
                    <Text style={styles.clearButtonText}>✕  clear notes</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Sentence translation */}
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

      {/* Word definition popup */}
      {popup && (
        <WordPopup
          word={popup.word}
          isFlagged={flaggedWords.has(popup.word.chinese)}
          onClose={() => setPopup(null)}
          onToggleFlag={() => handleToggleFlag(popup.word.chinese)}
        />
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

function WordPopup({
  word,
  isFlagged,
  onClose,
  onToggleFlag,
}: {
  word: Word;
  isFlagged: boolean;
  onClose: () => void;
  onToggleFlag: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.popupOverlay}>
        {/* Dismiss layer behind the card */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.popupCard}>
          <View style={styles.popupTopRow}>
            <Text style={styles.popupChinese}>{word.chinese}</Text>
            <TouchableOpacity onPress={onToggleFlag} style={styles.popupFlagButton}>
              <Text style={[styles.popupFlagIcon, isFlagged && styles.popupFlagIconActive]}>
                {isFlagged ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.popupPinyin}>{word.pinyin}</Text>
          <Text style={styles.popupEnglish}>{word.english}</Text>
          {isFlagged && (
            <Text style={styles.popupFlaggedNote}>Flagged for review</Text>
          )}
        </View>
      </View>
    </Modal>
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
  chineseCharRevealed: {
    color: '#c0392b',
  },
  punctChar: {
    fontSize: CHAR_SIZE,
    color: '#1a1a1a',
    lineHeight: CHAR_SIZE + 4,
  },

  // Clear notes button
  clearRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: 2,
  },
  clearButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f5c6c0',
    backgroundColor: '#fff6f5',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  clearButtonText: {
    fontSize: 11,
    color: '#c0392b',
    fontWeight: '600',
  },

  // Sentence translation
  sentenceEnglish: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Word popup
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  popupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  popupChinese: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 2,
    flex: 1,
  },
  popupFlagButton: {
    padding: 4,
    marginTop: 4,
  },
  popupFlagIcon: {
    fontSize: 24,
    color: '#ccc',
  },
  popupFlagIconActive: {
    color: '#e67e22',
  },
  popupPinyin: {
    fontSize: 16,
    color: '#c0392b',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  popupEnglish: {
    fontSize: 17,
    color: '#333',
    lineHeight: 24,
    marginTop: 6,
  },
  popupFlaggedNote: {
    fontSize: 12,
    color: '#e67e22',
    marginTop: 4,
    fontStyle: 'italic',
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
