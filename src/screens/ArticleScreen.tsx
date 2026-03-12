import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList, Sentence, VocabularyItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleScreen({ route }: Props) {
  const { article } = route.params;
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Toggle Controls */}
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

      {/* Article Title */}
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
              <Text style={[styles.badgeText, styles.badgeTopicText]}>{article.topic}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sentences */}
      <View style={styles.articleBody}>
        {article.sentences.map((sentence: Sentence, index: number) => (
          <SentenceBlock
            key={index}
            sentence={sentence}
            showPinyin={showPinyin}
            showTranslation={showTranslation}
          />
        ))}
      </View>

      {/* Vocabulary List */}
      {article.vocabulary.length > 0 && (
        <View style={styles.vocabSection}>
          <Text style={styles.vocabHeader}>Vocabulary</Text>
          <Text style={styles.vocabSubheader}>
            {article.vocabulary.length} new word{article.vocabulary.length !== 1 ? 's' : ''} in this article
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

function SentenceBlock({
  sentence,
  showPinyin,
  showTranslation,
}: {
  sentence: Sentence;
  showPinyin: boolean;
  showTranslation: boolean;
}) {
  return (
    <View style={styles.sentenceBlock}>
      {showPinyin && <Text style={styles.pinyinText}>{sentence.pinyin}</Text>}
      <Text style={styles.chineseText}>{sentence.chinese}</Text>
      {showTranslation && (
        <Text style={styles.englishText}>{sentence.english}</Text>
      )}
    </View>
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
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
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
    fontSize: 14,
    color: '#888',
    letterSpacing: 0.5,
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
  articleBody: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sentenceBlock: {
    gap: 3,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  pinyinText: {
    fontSize: 12,
    color: '#c0392b',
    letterSpacing: 0.3,
  },
  chineseText: {
    fontSize: 22,
    color: '#1a1a1a',
    lineHeight: 32,
    letterSpacing: 1,
  },
  englishText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
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
