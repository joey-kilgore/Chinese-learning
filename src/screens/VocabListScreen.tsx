import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { archiveWord, fetchAllFlaggedWords } from '../services/supabase';
import { FlaggedWordRow } from '../types';
import { FONT_CHINESE, FONT_CHINESE_BOLD } from '../styles/fonts';

function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

export function VocabListScreen() {
  const navigation = useNavigation();
  const [words, setWords] = useState<FlaggedWordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FlaggedWordRow | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchAllFlaggedWords();
    setWords(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmArchive() {
    if (!selected) return;
    setConfirmingArchive(false);
    setSelected(null);
    await archiveWord(selected.id);
    setWords((prev) => prev.filter((w) => w.id !== selected.id));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c0392b" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No flagged words yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap any word while reading an article to flag it for study.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Table header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.colChinese, styles.headerText]}>Word</Text>
          <Text style={[styles.colPinyin, styles.headerText]}>Pinyin</Text>
          <Text style={[styles.colEnglish, styles.headerText]}>English</Text>
          <Text style={[styles.colViews, styles.headerText]}>Seen</Text>
        </View>

        {words.map((word, idx) => (
          <TouchableOpacity
            key={word.id}
            style={[styles.row, idx % 2 === 1 && styles.rowAlt]}
            onPress={() => setSelected(word)}
            activeOpacity={0.7}
          >
            <Text style={[styles.colChinese, styles.cellChinese]}>{word.chinese}</Text>
            <Text style={[styles.colPinyin, styles.cellText]}>{word.pinyin}</Text>
            <Text style={[styles.colEnglish, styles.cellText]} numberOfLines={1}>{word.english}</Text>
            <Text style={[styles.colViews, styles.cellViews]}>
              {word.article_views + word.flashcard_views}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Word detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => { setSelected(null); setConfirmingArchive(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setSelected(null); setConfirmingArchive(false); }}
        />
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {/* Chinese word */}
            <Text style={styles.sheetChinese}>{selected.chinese}</Text>
            <Text style={styles.sheetPinyin}>{selected.pinyin}</Text>
            <Text style={styles.sheetEnglish}>{selected.english}</Text>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selected.article_views}</Text>
                <Text style={styles.statLabel}>In articles</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selected.flashcard_views}</Text>
                <Text style={styles.statLabel}>In flashcards</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selected.repetitions}</Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{selected.interval}d</Text>
                <Text style={styles.statLabel}>Interval</Text>
              </View>
            </View>

            {/* Next review */}
            <View style={styles.dueRow}>
              <Text style={styles.dueText}>{formatDueDate(selected.due_date)}</Text>
            </View>

            {/* Example sentence */}
            {selected.example_sentence && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>Example</Text>
                <Text style={styles.exampleChinese}>{selected.example_sentence}</Text>
                {selected.example_sentence_english && (
                  <Text style={styles.exampleEnglish}>{selected.example_sentence_english}</Text>
                )}
              </View>
            )}

            {/* Archive */}
            {confirmingArchive ? (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>
                  Remove <Text style={styles.confirmWord}>{selected.chinese}</Text> from active study?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.confirmCancel}
                    onPress={() => setConfirmingArchive(false)}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmArchive} onPress={confirmArchive}>
                    <Text style={styles.confirmArchiveText}>Archive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.archiveButton}
                  onPress={() => setConfirmingArchive(true)}
                >
                  <Text style={styles.archiveButtonText}>Archive word</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissButton} onPress={() => setSelected(null)}>
                  <Text style={styles.dismissButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptySubtitle: {
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
    paddingBottom: 32,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowAlt: {
    backgroundColor: '#fafafa',
  },
  headerRow: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  colChinese: { width: 60 },
  colPinyin: { flex: 1 },
  colEnglish: { flex: 2 },
  colViews: { width: 40, textAlign: 'right' },

  cellChinese: {
    fontFamily: FONT_CHINESE_BOLD,
    fontSize: 20,
    color: '#1a1a1a',
  },
  cellText: {
    fontSize: 14,
    color: '#444',
  },
  cellViews: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textAlign: 'right',
  },

  // Modal / bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },
  sheetChinese: {
    fontFamily: FONT_CHINESE_BOLD,
    fontSize: 52,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 4,
  },
  sheetPinyin: {
    fontSize: 18,
    color: '#c0392b',
    textAlign: 'center',
  },
  sheetEnglish: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },

  dueRow: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b8860b',
  },

  exampleBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
    paddingTop: 12,
    gap: 4,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleChinese: {
    fontFamily: FONT_CHINESE,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  exampleEnglish: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  archiveButton: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    paddingVertical: 12,
    alignItems: 'center',
  },
  archiveButtonText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#999',
    fontSize: 15,
  },

  confirmBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fcc',
    padding: 16,
    gap: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmWord: {
    fontFamily: FONT_CHINESE_BOLD,
    fontSize: 16,
    color: '#1a1a1a',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  confirmArchive: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
  },
  confirmArchiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
