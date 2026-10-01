import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  StatusBar
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  BookOpen,
  Search,
  QrCode,
  Globe,
  Camera,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CheckCircle2
} from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const loadData = async () => {
    const catalogData = await mobileApi.getCatalog();
    const loanData = await mobileApi.getStudentLoans('FCC/CEM/2024/042');
    setBooks(catalogData);
    setLoans(loanData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickSearch = () => {
    if (navigation) {
      navigation.navigate('Search', { initialQuery: quickQuery });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={styles.govBadge}>
              <Text style={styles.govBadgeText}>FED. REP. OF NIGERIA</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.dot} />
              <Text style={styles.liveText}>Laravel 11 Connected</Text>
            </View>
          </View>
          <Text style={styles.institutionName}>Federal Cooperative College</Text>
          <Text style={styles.subTitle}>Prof. Hezekiah Central ILS Mobile</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Scholar Welcome Card */}
        <View style={styles.scholarCard}>
          <View style={styles.scholarTop}>
            <View>
              <Text style={styles.welcomeLabel}>STUDENT SCHOLAR</Text>
              <Text style={styles.scholarName}>Adebayo Oluwaseun</Text>
              <Text style={styles.matricText}>FCC/CEM/2024/042 • Coop. Economics</Text>
            </View>
            <TouchableOpacity
              style={styles.qrIconBtn}
              onPress={() => navigation && navigation.navigate('ScholarCard')}
            >
              <QrCode size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{loans.length}</Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Overdue Fines</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.primary }]}>CLEARED</Text>
              <Text style={styles.statLabel}>Library Status</Text>
            </View>
          </View>
        </View>

        {/* Quick Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, authors, call numbers..."
              placeholderTextColor={colors.textDim}
              value={quickQuery}
              onChangeText={setQuickQuery}
              onSubmitEditing={handleQuickSearch}
            />
            {quickQuery.length > 0 && (
              <TouchableOpacity onPress={handleQuickSearch} style={styles.goBtn}>
                <Text style={styles.goBtnText}>Go</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigation Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Library Ecosystem Services</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.primaryDark }]}
            onPress={() => navigation && navigation.navigate('Search')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primaryGlow }]}>
              <BookOpen size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionTitle}>FCC Catalog</Text>
            <Text style={styles.actionDesc}>Print & e-Books holdings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.accent }]}
            onPress={() => navigation && navigation.navigate('GlobalApis')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#312e81' }]}>
              <Globe size={22} color={colors.accent} />
            </View>
            <Text style={styles.actionTitle}>World APIs</Text>
            <Text style={styles.actionDesc}>Open Library & Google Books</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.gold }]}
            onPress={() => navigation && navigation.navigate('ScholarCard')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#451a03' }]}>
              <QrCode size={22} color={colors.gold} />
            </View>
            <Text style={styles.actionTitle}>Digital ID</Text>
            <Text style={styles.actionDesc}>Gate Pass & Active Loans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.cyan }]}
            onPress={() => navigation && navigation.navigate('Scanner')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#083344' }]}>
              <Camera size={22} color={colors.cyan} />
            </View>
            <Text style={styles.actionTitle}>Circulation</Text>
            <Text style={styles.actionDesc}>Barcode & ISBN scanner</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Monographs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Ingested Monographs</Text>
          <TouchableOpacity onPress={() => navigation && navigation.navigate('Search')}>
            <Text style={styles.seeAllText}>View All ({books.length})</Text>
          </TouchableOpacity>
        </View>

        {books.slice(0, 3).map((book) => (
          <TouchableOpacity
            key={book.id}
            style={styles.bookCard}
            onPress={() => navigation && navigation.navigate('Search', { initialQuery: book.title })}
          >
            <Image
              source={{ uri: book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150' }}
              style={styles.bookThumb}
            />
            <View style={styles.bookInfo}>
              <View style={styles.callRow}>
                <Text style={styles.callBadge}>{book.callNumber || 'GEN-LIB'}</Text>
                <Text style={styles.copiesText}>
                  {book.copies_available || 1} available
                </Text>
              </View>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.bookAuthor} numberOfLines={1}>
                {book.author}
              </Text>
              <Text style={styles.bookMeta}>
                {book.publisher} • {book.year}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
          </TouchableOpacity>
        ))}

        <View style={styles.footerNote}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={styles.footerText}>
            Secured by Laravel 11.57 REST API & Dual-Engine Sync
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  govBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  govBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  institutionName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scholarCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  scholarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  scholarName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  matricText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  qrIconBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.cardBorder,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  goBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionDesc: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  bookThumb: {
    width: 48,
    height: 68,
    borderRadius: 8,
    backgroundColor: colors.cardSubtle,
  },
  bookInfo: {
    flex: 1,
  },
  callRow: {
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
  copiesText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  bookAuthor: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  bookMeta: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontSize: 10,
    color: colors.textDim,
  },
});
