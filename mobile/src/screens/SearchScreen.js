import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Linking
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  Search,
  Globe,
  BookOpen,
  Filter,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  X,
  Layers
} from 'lucide-react-native';

const SUBJECT_FILTERS = [
  'All',
  'Cooperative Economics',
  'Computer Science',
  'Agricultural Science',
  'Banking & Finance'
];

export default function SearchScreen({ route }) {
  const initialQuery = route?.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('local'); // 'local' | 'global'
  const [activeSubject, setActiveSubject] = useState('All');
  
  // Local Catalog State
  const [localBooks, setLocalBooks] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  // Global APIs State
  const [globalResults, setGlobalResults] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalProviders, setGlobalProviders] = useState([]);

  useEffect(() => {
    loadLocalBooks();
  }, []);

  const loadLocalBooks = async () => {
    setLoadingLocal(true);
    const data = await mobileApi.getCatalog();
    setLocalBooks(data);
    setLoadingLocal(false);
  };

  const handleSearchGlobal = async (term = query) => {
    setLoadingGlobal(true);
    const data = await mobileApi.searchGlobalApis(term || 'cooperative agriculture');
    if (data && data.results) {
      setGlobalResults(data.results);
      setGlobalProviders(data.providers_queried || []);
    }
    setLoadingGlobal(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'global' && globalResults.length === 0) {
      handleSearchGlobal(query);
    }
  };

  const filteredLocalBooks = localBooks.filter((b) => {
    const matchesSubject = activeSubject === 'All' || b.subject === activeSubject;
    const q = query.toLowerCase().trim();
    if (!q) return matchesSubject;
    const matchesQuery =
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.callNumber && b.callNumber.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.toLowerCase().includes(q));
    return matchesSubject && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'local'
                ? "Search FCC catalog..."
                : "Search Open Library, Google Books, Gutenberg..."
            }
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (activeTab === 'global') {
                handleSearchGlobal(query);
              }
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'local' && styles.tabBtnActive]}
            onPress={() => handleTabChange('local')}
          >
            <BookOpen size={14} color={activeTab === 'local' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'local' && styles.tabBtnTextActive]}>
              FCC Central Holdings ({filteredLocalBooks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'global' && styles.tabBtnActiveGlobal]}
            onPress={() => handleTabChange('global')}
          >
            <Globe size={14} color={activeTab === 'global' ? colors.cyan : colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'global' && styles.tabBtnTextActiveGlobal]}>
              World Library APIs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Local Subject Pills */}
      {activeTab === 'local' && (
        <View style={styles.filterBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={SUBJECT_FILTERS}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pill, activeSubject === item && styles.pillActive]}
                onPress={() => setActiveSubject(item)}
              >
                <Text style={[styles.pillText, activeSubject === item && styles.pillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Global Query Status Bar */}
      {activeTab === 'global' && (
        <View style={styles.globalStatusBar}>
          <View style={styles.globalStatusRow}>
            <Globe size={14} color={colors.cyan} />
            <Text style={styles.globalStatusText}>
              Federated: Open Library, Google Books, Gutenberg, Crossref
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshGlobalBtn}
            onPress={() => handleSearchGlobal(query)}
            disabled={loadingGlobal}
          >
            <Text style={styles.refreshGlobalText}>
              {loadingGlobal ? "Querying..." : "Search Worldwide"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Content */}
      {activeTab === 'local' ? (
        loadingLocal ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading library holdings...</Text>
          </View>
        ) : filteredLocalBooks.length === 0 ? (
          <View style={styles.centerBox}>
            <AlertCircle size={36} color={colors.amber} />
            <Text style={styles.emptyTitle}>No matching catalog books</Text>
            <Text style={styles.emptyDesc}>Try searching the global connected library APIs instead.</Text>
            <TouchableOpacity
              style={styles.switchGlobalBtn}
              onPress={() => handleTabChange('global')}
            >
              <Globe size={16} color={colors.bg} />
              <Text style={styles.switchGlobalBtnText}>Search World Free Library APIs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredLocalBooks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.bookCard}>
                <Image
                  source={{ uri: item.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150' }}
                  style={styles.bookCover}
                />
                <View style={styles.bookBody}>
                  <View style={styles.topRow}>
                    <Text style={styles.callBadge}>{item.callNumber || 'GEN-LIB'}</Text>
                    <Text style={styles.availableBadge}>
                      {item.copies_available || 1} on shelf
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.author} numberOfLines={1}>
                    {item.author}
                  </Text>
                  <Text style={styles.meta}>
                    {item.publisher} • {item.year}
                  </Text>
                  <View style={styles.tagsRow}>
                    <View style={styles.subTag}>
                      <Text style={styles.subTagText}>{item.subject || 'Monograph'}</Text>
                    </View>
                    {item.is_digital && (
                      <View style={styles.digitalTag}>
                        <Text style={styles.digitalTagText}>PDF E-Book</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          />
        )
      ) : (
        /* Global Library APIs Results */
        loadingGlobal ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.cyan} />
            <Text style={styles.loadingText}>Federating query across worldwide library APIs...</Text>
          </View>
        ) : globalResults.length === 0 ? (
          <View style={styles.centerBox}>
            <Globe size={36} color={colors.cyan} />
            <Text style={styles.emptyTitle}>No World API results found</Text>
            <Text style={styles.emptyDesc}>Try broad keywords like "agriculture", "economics", or "technology".</Text>
          </View>
        ) : (
          <FlatList
            data={globalResults}
            keyExtractor={(item, index) => `${item.provider}-${index}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.globalCard}>
                <View style={styles.globalHeader}>
                  <View style={styles.providerBadge}>
                    <Text style={styles.providerText}>{item.provider || 'World API'}</Text>
                  </View>
                  {item.year && (
                    <Text style={styles.globalYearText}>{item.year}</Text>
                  )}
                </View>
                <Text style={styles.globalTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.globalAuthor} numberOfLines={1}>
                  {item.author || 'Scholarly Collective'}
                </Text>
                {item.snippet ? (
                  <Text style={styles.globalSnippet} numberOfLines={2}>
                    "{item.snippet}"
                  </Text>
                ) : null}
                <View style={styles.globalActions}>
                  {item.preview_url ? (
                    <TouchableOpacity
                      style={styles.previewBtn}
                      onPress={() => Linking.openURL(item.preview_url)}
                    >
                      <ExternalLink size={13} color={colors.cyan} />
                      <Text style={styles.previewBtnText}>Read / Preview</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.reqBtn}>
                    <PlusCircle size={13} color={colors.primary} />
                    <Text style={styles.reqBtnText}>Request Physical Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#064e3b',
  },
  tabBtnActiveGlobal: {
    backgroundColor: '#164e63',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabBtnTextActiveGlobal: {
    color: colors.cyan,
    fontWeight: '700',
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.bg,
    fontWeight: '700',
  },
  globalStatusBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#083344',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  globalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  globalStatusText: {
    fontSize: 10,
    color: colors.cyan,
    fontWeight: '600',
  },
  refreshGlobalBtn: {
    backgroundColor: colors.cyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshGlobalText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.bg,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  bookCover: {
    width: 54,
    height: 78,
    borderRadius: 8,
    backgroundColor: colors.cardSubtle,
  },
  bookBody: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  callBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.bg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  availableBadge: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  author: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  subTag: {
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subTagText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  digitalTag: {
    backgroundColor: '#312e81',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  digitalTagText: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: '600',
  },
  globalCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  globalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerBadge: {
    backgroundColor: '#164e63',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  providerText: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  globalYearText: {
    fontSize: 10,
    color: colors.textDim,
  },
  globalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  globalAuthor: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  globalSnippet: {
    fontSize: 11,
    color: colors.textDim,
    fontStyle: 'italic',
    marginTop: 6,
  },
  globalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#083344',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewBtnText: {
    fontSize: 10,
    color: colors.cyan,
    fontWeight: '600',
  },
  reqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reqBtnText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  switchGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  switchGlobalBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 12,
  },
});
