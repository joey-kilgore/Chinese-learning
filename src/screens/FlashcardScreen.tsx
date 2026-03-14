import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchDueFlashcards, updateFlashcardReview, incrementFlashcardView } from '../services/supabase';
import { FlaggedWordRow } from '../types';
import { FONT_CHINESE, FONT_CHINESE_BOLD } from '../styles/fonts';

export function FlashcardScreen() {
  const navigation = useNavigation();
  // queue: cards remaining this session; Again moves current card to the back
  const [queue, setQueue] = useState<FlaggedWordRow[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(0);
  // Track IDs already counted this session so "Again" cards aren't double-counted
  const viewedIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchDueFlashcards().then((rows) => {
      setQueue(rows);
      setTotalCards(rows.length);
      setLoading(false);
    });
  }, []);

  async function handleAnswer(correct: boolean) {
    const card = queue[0];
    if (!viewedIds.current.has(card.id)) {
      viewedIds.current.add(card.id);
      incrementFlashcardView(card.id); // fire-and-forget
    }
    await updateFlashcardReview(card.id, correct);
    setRevealed(false);
    if (correct) {
      setPassed((n) => n + 1);
      setQueue((q) => q.slice(1));        // remove from front — done
    } else {
      setQueue((q) => [...q.slice(1), q[0]]); // move to back — try again later
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c0392b" />
      </View>
    );
  }

  if (totalCards === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>No cards due!</Text>
        <Text style={styles.doneSubtitle}>
          Flag words while reading articles to add them here.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (queue.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✓</Text>
        <Text style={styles.doneTitle}>Session complete!</Text>
        <Text style={styles.doneSubtitle}>
          Passed {passed} of {totalCards} card{totalCards !== 1 ? 's' : ''}.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = queue[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{passed} / {totalCards}</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${(passed / totalCards) * 100}%` }]}
          />
        </View>
        <Text style={styles.remainingText}>{queue.length} left</Text>
      </View>

      {/* Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={revealed ? 1 : 0.7}
        onPress={!revealed ? () => setRevealed(true) : undefined}
      >
        {/* Front — always visible */}
        <Text style={styles.cardChinese}>{card.chinese}</Text>

        {card.example_sentence && (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleChinese}>{card.example_sentence}</Text>
          </View>
        )}

        {/* Back — revealed after tap */}
        {revealed ? (
          <View style={styles.backContent}>
            <Text style={styles.cardPinyin}>{card.pinyin}</Text>
            <Text style={styles.cardEnglish}>{card.english}</Text>
            {card.example_sentence_english && (
              <Text style={styles.exampleEnglish}>{card.example_sentence_english}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.tapHint}>tap to reveal</Text>
        )}
      </TouchableOpacity>

      {/* Action */}
      {!revealed ? (
        <TouchableOpacity style={styles.revealButton} onPress={() => setRevealed(true)}>
          <Text style={styles.revealButtonText}>Show Answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.gradeRow}>
          <TouchableOpacity
            style={[styles.gradeButton, styles.gradeAgain]}
            onPress={() => handleAnswer(false)}
          >
            <Text style={[styles.gradeButtonText, styles.gradeAgainText]}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, styles.gradeGood]}
            onPress={() => handleAnswer(true)}
          >
            <Text style={[styles.gradeButtonText, styles.gradeGoodText]}>Got it</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#f5f5f5',
  },
  doneEmoji: {
    fontSize: 56,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 12,
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    minWidth: 36,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c0392b',
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 13,
    color: '#888',
    minWidth: 36,
    textAlign: 'right',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 220,
    justifyContent: 'center',
  },
  cardChinese: {
    fontSize: 72,
    fontFamily: FONT_CHINESE_BOLD,
    color: '#1a1a1a',
    letterSpacing: 4,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  backContent: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  cardPinyin: {
    fontSize: 20,
    color: '#c0392b',
    letterSpacing: 0.5,
  },
  cardEnglish: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  exampleBox: {
    marginTop: 12,
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
    paddingTop: 12,
  },
  exampleChinese: {
    fontSize: 16,
    fontFamily: FONT_CHINESE,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
  },
  exampleEnglish: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },

  revealButton: {
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#c0392b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  gradeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
  },
  gradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradeAgain: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  gradeAgainText: {
    color: '#e74c3c',
  },
  gradeGood: {
    borderColor: '#27ae60',
    backgroundColor: '#f0faf4',
  },
  gradeGoodText: {
    color: '#27ae60',
  },
});
