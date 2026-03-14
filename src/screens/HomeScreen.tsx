import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { generateArticle, USE_SAVED, DEV_API_KEY } from '../services/claudeApi';
import { saveArticle, fetchArticleHistory, fetchPracticeWords, ArticleHistoryRow } from '../services/supabase';
import { HskLevel, RootStackParamList } from '../types';

const API_KEY_STORAGE_KEY = '@chinese_learning/api_key';

const HSK_LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const HSK_DESCRIPTIONS: Record<HskLevel, string> = {
  1: 'Beginner — ~150 words',
  2: 'Elementary — ~300 words',
  3: 'Pre-intermediate — ~600 words',
  4: 'Intermediate — ~1,200 words',
  5: 'Upper-intermediate — ~2,500 words',
  6: 'Advanced — ~5,000 words',
  7: 'Professional — ~8,000 words',
  8: 'Expert — ~11,000 words',
  9: 'Master — ~15,000+ words',
};

const SUGGESTED_TOPICS = [
  'Daily life', 'Food & cooking', 'Travel', 'Weather', 'Family',
  'Work', 'Hobbies', 'Technology', 'Nature', 'History',
];

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [hskLevel, setHskLevel] = useState<HskLevel>(3);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [history, setHistory] = useState<ArticleHistoryRow[]>([]);
  const [practiceToggle, setPracticeToggle] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkApiKey();
      loadHistory();
    });
    checkApiKey();
    loadHistory();
    return unsubscribe;
  }, [navigation]);

  async function loadHistory() {
    const rows = await fetchArticleHistory();
    setHistory(rows);
  }

  async function checkApiKey() {
    const key = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    setHasApiKey(!!key?.trim() || !!DEV_API_KEY);
  }

  async function handleGenerate() {
    const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    if (!USE_SAVED && !apiKey?.trim() && !DEV_API_KEY) {
      Alert.alert(
        'API Key Required',
        'Please add your Anthropic API key in Settings before generating articles.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      let practiceWords: string[] | undefined;
      if (practiceToggle) {
        const rows = await fetchPracticeWords(5);
        practiceWords = rows.map((r) => r.chinese);
      }
      const article = await generateArticle(apiKey?.trim() ?? '', hskLevel, topic, practiceWords);
      saveArticle(article); // fire-and-forget; don't block navigation
      navigation.navigate('Article', { article });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>可懂</Text>
          <Text style={styles.headerSubtitle}>Comprehensible Chinese</Text>
        </View>

        {USE_SAVED && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Using saved articles — no API calls
            </Text>
          </View>
        )}

        {!USE_SAVED && !hasApiKey && (
          <TouchableOpacity
            style={styles.banner}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.bannerText}>
              Set your Anthropic API key in Settings to get started
            </Text>
          </TouchableOpacity>
        )}

        {/* HSK Level Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your HSK Level</Text>
          <Text style={styles.cardSubtitle}>{HSK_DESCRIPTIONS[hskLevel]}</Text>
          <View style={styles.levelGrid}>
            {HSK_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.levelButton, hskLevel === level && styles.levelButtonActive]}
                onPress={() => setHskLevel(level)}
              >
                <Text
                  style={[
                    styles.levelButtonText,
                    hskLevel === level && styles.levelButtonTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Topic */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Topic (optional)</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. cooking, travel, technology..."
            placeholderTextColor="#aaa"
            returnKeyType="done"
          />
          <Text style={styles.cardSubtitle}>Or pick a suggestion:</Text>
          <View style={styles.chipRow}>
            {SUGGESTED_TOPICS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, topic === t && styles.chipActive]}
                onPress={() => setTopic(topic === t ? '' : t)}
              >
                <Text style={[styles.chipText, topic === t && styles.chipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Practice Words Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.cardTitle}>Practice flagged words</Text>
              <Text style={styles.cardSubtitle}>Include your 5 least-practiced words in the article</Text>
            </View>
            <Switch
              value={practiceToggle}
              onValueChange={setPracticeToggle}
              trackColor={{ false: '#ddd', true: '#f0b3ad' }}
              thumbColor={practiceToggle ? '#c0392b' : '#bbb'}
            />
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Article</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Articles use HSK {hskLevel} vocabulary with a few level-{Math.min(hskLevel + 1, 9)}{' '}
          words for comprehensible i+1 learning.
        </Text>

        {/* Study Buttons */}
        <View style={styles.studyRow}>
          <TouchableOpacity
            style={[styles.studyButton, styles.studyButtonOutline]}
            onPress={() => navigation.navigate('Flashcards')}
          >
            <Text style={styles.studyButtonOutlineText}>Flashcards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.studyButton, styles.studyButtonOutline]}
            onPress={() => navigation.navigate('VocabList')}
          >
            <Text style={styles.studyButtonOutlineText}>My Vocabulary</Text>
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Recent Articles</Text>
            {history.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.historyCard}
                onPress={() => navigation.navigate('Article', { article: row.article })}
              >
                <View style={styles.historyCardHeader}>
                  <Text style={styles.historyCardChinese}>{row.article.title}</Text>
                  <Text style={styles.historyCardBadge}>HSK {row.article.hsk_level}</Text>
                </View>
                <Text style={styles.historyCardEnglish}>{row.article.title_english}</Text>
                <Text style={styles.historyCardMeta}>
                  {row.article.topic} · {new Date(row.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#c0392b',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mockBanner: {
    backgroundColor: '#e8f4fd',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#aed6f1',
    alignItems: 'center',
  },
  mockBannerText: {
    color: '#1a5276',
    fontSize: 13,
    fontWeight: '500',
  },
  banner: {
    backgroundColor: '#fef3cd',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd166',
  },
  bannerText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  levelButtonActive: {
    borderColor: '#c0392b',
    backgroundColor: '#c0392b',
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fafafa',
  },
  chipActive: {
    borderColor: '#c0392b',
    backgroundColor: '#fff0ee',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
  },
  chipTextActive: {
    color: '#c0392b',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    gap: 2,
  },
  studyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  studyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  studyButtonOutline: {
    borderWidth: 2,
    borderColor: '#c0392b',
    backgroundColor: '#fff',
  },
  studyButtonOutlineText: {
    color: '#c0392b',
    fontSize: 15,
    fontWeight: '700',
  },
  generateButton: {
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
  generateButtonDisabled: {
    backgroundColor: '#e08070',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    paddingBottom: 8,
  },
  historySection: {
    gap: 8,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardChinese: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  historyCardBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c0392b',
    backgroundColor: '#fff0ee',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  historyCardEnglish: {
    fontSize: 13,
    color: '#444',
  },
  historyCardMeta: {
    fontSize: 12,
    color: '#999',
  },
});
