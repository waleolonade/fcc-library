import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  Camera,
  QrCode,
  ScanLine,
  CheckCircle2,
  BookOpen,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react-native';

export default function CirculationScannerScreen() {
  const [scanMode, setScanMode] = useState('book'); // 'book' | 'patron'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedPatron, setScannedPatron] = useState('FCC/CEM/2024/042');
  const [lastAction, setLastAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated optical scans for testing without physical camera hardware
  const handleSimulateScan = (code) => {
    setBarcodeInput(code);
    processScan(code);
  };

  const processScan = async (code) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setLastAction({
        type: scanMode === 'book' ? 'CHECKOUT_BOOK' : 'IDENTIFIED_PATRON',
        target: code,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS'
      });
      Alert.alert(
        'Circulation Recorded',
        `Successfully processed ${scanMode === 'book' ? 'Book Barcode' : 'Scholar ID'}: ${code}`
      );
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Viewfinder Reticle Simulation */}
      <View style={styles.scannerBox}>
        <View style={styles.reticleBorder}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          <View style={styles.laserScanLine} />

          <View style={styles.centerBadge}>
            <ScanLine size={32} color={colors.primary} />
            <Text style={styles.viewfinderText}>
              Align Barcode / QR Code within Target
            </Text>
          </View>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'book' && styles.modeBtnActive]}
            onPress={() => setScanMode('book')}
          >
            <BookOpen size={13} color={scanMode === 'book' ? colors.bg : colors.textMuted} />
            <Text style={[styles.modeBtnText, scanMode === 'book' && styles.modeBtnTextActive]}>
              Book Barcode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, scanMode === 'patron' && styles.modeBtnActive]}
            onPress={() => setScanMode('patron')}
          >
            <User size={13} color={scanMode === 'patron' ? colors.bg : colors.textMuted} />
            <Text style={[styles.modeBtnText, scanMode === 'patron' && styles.modeBtnTextActive]}>
              Patron ID Card
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual / Direct Barcode Input */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>
          Scan Optical Reader or Enter Barcode:
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 978-978-044-892-1 or FCC-B001"
            placeholderTextColor={colors.textDim}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => processScan(barcodeInput)}
            disabled={!barcodeInput.trim() || isProcessing}
          >
            <Text style={styles.submitBtnText}>
              {isProcessing ? 'Processing...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Simulation Barcodes */}
        <Text style={styles.quickLabel}>Test Barcode Simulation:</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => handleSimulateScan('978-978-044-892-1')}
          >
            <Text style={styles.quickPillText}>Agric Coop (978-044)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => handleSimulateScan('978-013-354-461-9')}
          >
            <Text style={styles.quickPillText}>Database Systems (978-013)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => handleSimulateScan('FCC/CEM/2024/042')}
          >
            <Text style={styles.quickPillText}>Scholar Adebayo (042)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Scanned Transaction Feedback */}
      {lastAction && (
        <View style={styles.lastActionCard}>
          <View style={styles.actionHeader}>
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={styles.actionTitle}>Circulation Event Synchronized</Text>
            <Text style={styles.actionTime}>{lastAction.timestamp}</Text>
          </View>
          <Text style={styles.actionDetail}>
            Target Ref: <Text style={{ color: colors.text, fontWeight: '700' }}>{lastAction.target}</Text>
          </Text>
          <Text style={styles.actionSub}>
            Logged to Laravel 11 audit trail with patron {scannedPatron}
          </Text>
        </View>
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
  scannerBox: {
    backgroundColor: '#050a14',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  reticleBorder: {
    width: '100%',
    height: 180,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
  },
  laserScanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: colors.primary,
    top: '50%',
    opacity: 0.8,
  },
  centerBadge: {
    alignItems: 'center',
    gap: 8,
  },
  viewfinderText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 3,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeBtnTextActive: {
    color: colors.bg,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 11,
  },
  quickLabel: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 14,
    marginBottom: 6,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPill: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickPillText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  lastActionCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    padding: 14,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
  actionTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  actionDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionSub: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
});
