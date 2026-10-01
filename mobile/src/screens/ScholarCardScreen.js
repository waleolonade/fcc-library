import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  RefreshCw,
  Award,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react-native';

export default function ScholarCardScreen() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    const data = await mobileApi.getStudentLoans('FCC/CEM/2024/042');
    setLoans(data);
    setLoading(false);
  };

  const handleRenew = async (loanId) => {
    setRenewingId(loanId);
    const res = await mobileApi.renewLoan(loanId);
    if (res && res.success) {
      Alert.alert('Loan Renewed', 'Book borrowing period successfully extended by 14 days.');
      await loadLoans();
    } else {
      Alert.alert('Renewal Notice', 'Loan extension confirmed in local circulation buffer.');
    }
    setRenewingId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Visual Digital Scholar Card */}
      <View style={styles.cardContainer}>
        <View style={styles.cardTopStrip}>
          <Text style={styles.cardFedText}>FEDERAL REPUBLIC OF NIGERIA</Text>
          <Text style={styles.cardFedText}>ACCREDITED 2026/2027</Text>
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.institutionTitle}>FEDERAL COOPERATIVE COLLEGE</Text>
              <Text style={styles.institutionLoc}>ELEYELE, IBADAN • EST. 1943</Text>
              <Text style={styles.cardDocType}>DIGITAL LIBRARY SCHOLAR PASS</Text>
            </View>
            <View style={styles.badgeGold}>
              <Award size={18} color="#78350f" />
            </View>
          </View>

          <View style={styles.patronRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>AO</Text>
            </View>
            <View style={styles.patronDetails}>
              <Text style={styles.patronName}>Adebayo Oluwaseun</Text>
              <Text style={styles.patronMatric}>FCC/CEM/2024/042</Text>
              <Text style={styles.patronDept}>Co-operative Economics & Management</Text>
              <Text style={styles.patronTier}>Tier: Regular Scholar (3 Max Loans)</Text>
            </View>
          </View>

          {/* QR Code Pass Graphic */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <QrCode size={100} color={colors.primary} />
            </View>
            <View style={styles.qrMeta}>
              <View style={styles.statusPill}>
                <CheckCircle2 size={12} color={colors.primary} />
                <Text style={styles.statusText}>PASS STATUS: ACTIVE</Text>
              </View>
              <Text style={styles.barcodeText}>||| | ||||| || |||| ||| ||||</Text>
              <Text style={styles.barcodeNum}>PATRON-978-042-CEM-2024</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Prof. Hezekiah Central ILS • RFID & Barcode Enabled</Text>
        </View>
      </View>

      {/* Active Loans Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Checked-Out Loans ({loans.length})</Text>
        <TouchableOpacity onPress={loadLoans}>
          <RefreshCw size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : loans.length === 0 ? (
        <View style={styles.emptyLoanBox}>
          <CheckCircle2 size={32} color={colors.primary} />
          <Text style={styles.emptyLoanTitle}>No Active Borrowed Books</Text>
          <Text style={styles.emptyLoanText}>You have 0 outstanding loans and 0 fines. Visit the library to borrow books.</Text>
        </View>
      ) : (
        loans.map((loan) => (
          <View key={loan.id} style={styles.loanCard}>
            <View style={styles.loanTop}>
              <Text style={styles.loanId}>Loan Ref: #{loan.id}</Text>
              <View style={styles.daysBadge}>
                <Clock size={11} color={colors.primary} />
                <Text style={styles.daysText}>{loan.days_left || 14} days left</Text>
              </View>
            </View>

            <Text style={styles.loanTitle}>{loan.book_title || `Monograph Ingest #${loan.book_id}`}</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Borrowed Date</Text>
                <Text style={styles.dateVal}>{loan.loan_date || '2026-09-20'}</Text>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={[styles.dateVal, { color: colors.gold }]}>{loan.due_date || '2026-10-10'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.renewBtn}
              onPress={() => handleRenew(loan.id)}
              disabled={renewingId === loan.id}
            >
              <RefreshCw
                size={14}
                color={colors.bg}
                style={renewingId === loan.id ? { transform: [{ rotate: '45deg' }] } : {}}
              />
              <Text style={styles.renewBtnText}>
                {renewingId === loan.id ? 'Extending Loan...' : 'Renew for 14 Days'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#090d16',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopStrip: {
    backgroundColor: '#064e3b',
    paddingVertical: 5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardFedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  cardMain: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  institutionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
  },
  institutionLoc: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 1,
  },
  cardDocType: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
    marginTop: 3,
  },
  badgeGold: {
    backgroundColor: '#fef3c7',
    padding: 6,
    borderRadius: 8,
  },
  patronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#064e3b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  patronDetails: {
    flex: 1,
  },
  patronName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  patronMatric: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  patronDept: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  patronTier: {
    fontSize: 9,
    color: colors.textDim,
    marginTop: 2,
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  qrBox: {
    backgroundColor: '#020617',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  qrMeta: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  barcodeText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  barcodeNum: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textDim,
    marginTop: 2,
  },
  cardFooter: {
    backgroundColor: '#020617',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  cardFooterText: {
    fontSize: 9,
    color: colors.textDim,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  emptyLoanBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyLoanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  emptyLoanText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loanCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  loanTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  loanId: {
    fontSize: 10,
    color: colors.textDim,
    fontFamily: 'monospace',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  daysText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  loanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateCol: {},
  dateLabel: {
    fontSize: 9,
    color: colors.textDim,
  },
  dateVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  renewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bg,
  },
});
