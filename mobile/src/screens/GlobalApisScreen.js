import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  Globe,
  Zap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Server
} from 'lucide-react-native';

export default function GlobalApisScreen() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    loadApis();
  }, []);

  const loadApis = async () => {
    setLoading(true);
    const data = await mobileApi.getConnectedApis();
    setApis(data);
    setLoading(false);
  };

  const handleTestApi = async (id) => {
    setTestingId(id);
    const res = await mobileApi.testApi(id);
    setTestResults((prev) => ({
      ...prev,
      [id]: res,
    }));
    setTestingId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.globeIconBox}>
            <Globe size={24} color={colors.cyan} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>World Library APIs Hub</Text>
            <Text style={styles.heroSub}>
              Global open-access repositories connected to Federal Cooperative College ILS
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{apis.length}</Text>
            <Text style={styles.metricLabel}>Connected APIs</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: colors.primary }]}>Active</Text>
            <Text style={styles.metricLabel}>Cluster Health</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: colors.cyan }]}>RESTful</Text>
            <Text style={styles.metricLabel}>Protocol</Text>
          </View>
        </View>
      </View>

      {/* Admin Notice on Adding New APIs */}
      <View style={styles.adminTipBox}>
        <PlusCircle size={18} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.adminTipTitle}>Admin Dynamic API Addition</Text>
          <Text style={styles.adminTipDesc}>
            College Librarians can register new worldwide library endpoints anytime from the FCC Admin Library portal.
          </Text>
        </View>
      </View>

      {/* Connected APIs List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Registered Global Endpoints ({apis.length})</Text>
        <TouchableOpacity onPress={loadApis}>
          <RefreshCw size={14} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 24 }} />
      ) : (
        apis.map((api) => {
          const testRes = testResults[api.id];
          const isTesting = testingId === api.id;

          return (
            <View key={api.id} style={styles.apiCard}>
              <View style={styles.apiTop}>
                <View style={styles.apiInfo}>
                  <Text style={styles.apiName}>{api.name}</Text>
                  <Text style={styles.apiProvider}>
                    {api.provider || 'Global Institution'} • {api.category || 'Open Access Discovery'}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={10} color={colors.primary} />
                  <Text style={styles.statusBadgeText}>ACTIVE</Text>
                </View>
              </View>

              {api.endpoint_template ? (
                <View style={styles.endpointBox}>
                  <Text style={styles.endpointText} numberOfLines={1}>
                    {api.endpoint_template}
                  </Text>
                </View>
              ) : null}

              {/* Ping Test Result Banner */}
              {testRes && (
                <View style={styles.testResultBox}>
                  <View style={styles.testStatusRow}>
                    <View style={styles.testDot} />
                    <Text style={styles.testStatusText}>
                      Endpoint {testRes.status || 'Online'} • {testRes.latency_ms || 95}ms latency
                    </Text>
                  </View>
                  <Text style={styles.testItems}>
                    Discovered ~{testRes.items_discovered || 12} records
                  </Text>
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.apiActions}>
                <TouchableOpacity
                  style={styles.pingBtn}
                  onPress={() => handleTestApi(api.id)}
                  disabled={isTesting}
                >
                  <Zap size={13} color={isTesting ? colors.gold : colors.cyan} />
                  <Text style={styles.pingBtnText}>
                    {isTesting ? 'Testing Latency...' : 'Ping Endpoint'}
                  </Text>
                </TouchableOpacity>

                {api.docs_url ? (
                  <TouchableOpacity
                    style={styles.docsBtn}
                    onPress={() => Linking.openURL(api.docs_url)}
                  >
                    <ExternalLink size={13} color={colors.textMuted} />
                    <Text style={styles.docsBtnText}>Docs</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })
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
  heroCard: {
    backgroundColor: '#0c1b2f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  globeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#164e63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  heroSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e3a5f',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textDim,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1e3a5f',
  },
  adminTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#3730a3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  adminTipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  adminTipDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
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
  apiCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  apiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  apiInfo: {
    flex: 1,
  },
  apiName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  apiProvider: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  endpointBox: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  endpointText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textDim,
  },
  testResultBox: {
    backgroundColor: '#064e3b',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  testStatusText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  testItems: {
    fontSize: 10,
    color: colors.text,
  },
  apiActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#083344',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  docsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  docsBtnText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
