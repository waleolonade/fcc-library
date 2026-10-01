import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';
import { colors } from '../theme';
import { mobileApi } from '../api/mobileApi';
import {
  Upload,
  BookOpen,
  FileText,
  Send,
  Sparkles,
  Building2,
  CheckCircle2,
  Barcode,
  Search,
  ShieldCheck,
  ChevronRight
} from 'lucide-react-native';

export default function HodUploadScreen({ navigation }) {
  const [ingestionMode, setIngestionMode] = useState('digital'); // 'digital' | 'physical'
  const [departmentCode, setDepartmentCode] = useState('CEM');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Dr. Mrs. F. A. Babalola');
  const [courseCode, setCourseCode] = useState('CEM 411');
  const [targetLevel, setTargetLevel] = useState('HND II');
  const [semester, setSemester] = useState('First Semester');
  const [resourceType, setResourceType] = useState('Lecture Handout');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [requestedCopies, setRequestedCopies] = useState('5');
  const [abstract, setAbstract] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);

  const courseChips = ['CEM 111', 'CEM 201', 'CEM 311', 'CEM 411', 'CSC 312', 'BNF 211'];

  const handleApplyPreset = (type) => {
    if (type === 'past_questions') {
      setIngestionMode('digital');
      setTitle('CEM 411: Cooperative Econometrics Past Examination Compendium');
      setAuthor('Departmental Examination Board');
      setCourseCode('CEM 411');
      setTargetLevel('HND II');
      setResourceType('Past Exam Questions');
      setAbstract('Past examination questions from 2020-2025 with syllabus marking guidelines.');
    } else if (type === 'handout') {
      setIngestionMode('digital');
      setTitle('CEM 311: Cooperative Enterprise Accounting Lecture Manual');
      setAuthor('Dr. Mrs. F. A. Babalola');
      setCourseCode('CEM 311');
      setTargetLevel('HND I');
      setResourceType('Lecture Handout');
      setAbstract('Complete lecture notes, tutorial problems, and weekly case exercises.');
    } else if (type === 'physical') {
      setIngestionMode('physical');
      setTitle('Principles of Agricultural Cooperative Banking and Hedging');
      setAuthor('Prof. Adebayo O. Adeleke');
      setCourseCode('CEM 315');
      setResourceType('Physical Book Acquisition Request');
      setIsbn('978-0198826729');
      setPublisher('Oxford Academic Press');
      setRequestedCopies('10');
      setAbstract('Core textbook recommended for NBTE revised syllabus. 10 physical copies requested.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the resource');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title,
      author,
      department_id: `DEP-${departmentCode}`,
      department_name: departmentCode === 'CSC' ? 'Computer Science' : 'Co-operative Economics & Management',
      uploaded_by_hod_id: `HOD-${departmentCode}-001`,
      hod_name: author,
      course_code: courseCode,
      target_level: targetLevel,
      semester,
      resource_type: ingestionMode === 'physical' ? 'Physical Book Acquisition Request' : resourceType,
      file_name: `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
      access_scope: 'Restricted to Department Students Only',
      review_notes: JSON.stringify({
        abstract,
        isbn,
        publisher,
        requested_copies: requestedCopies,
        mode: ingestionMode,
        submitted_from: 'FCC React Native Mobile App'
      })
    };

    const res = await mobileApi.submitDepartmentUpload(payload);
    setIsSubmitting(false);

    if (res.success) {
      setLastSubmission(res.upload);
      Alert.alert(
        'Staging Success',
        `Resource "${title}" staged successfully in Central Library Review Queue with ID: ${res.upload?.id}.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Could not submit resource to review queue.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Building2 size={13} color={colors.accent} />
          <Text style={styles.headerBadgeText}>HOD ACADEMIC INGESTION</Text>
        </View>
        <Text style={styles.headerTitle}>Departmental Upload Studio</Text>
        <Text style={styles.headerSubtitle}>
          Upload lecture handouts, past questions, or submit physical book acquisition requests into the Central Library Queue.
        </Text>
      </View>

      {/* Last Submission Notice */}
      {lastSubmission && (
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <CheckCircle2 size={18} color={colors.accent} />
            <Text style={styles.successTitle}>Active Staging Ticket</Text>
          </View>
          <Text style={styles.successText}>
            ID: <Text style={styles.boldMono}>{lastSubmission.id}</Text> • Status: <Text style={styles.statusPending}>Pending Review</Text>
          </Text>
          <Text style={styles.successDesc}>
            Chief Librarian will review, assign Call Number & publish to student shelf.
          </Text>
        </View>
      )}

      {/* Mode Switcher */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeTab, ingestionMode === 'digital' && styles.modeTabActive]}
          onPress={() => setIngestionMode('digital')}
        >
          <FileText size={14} color={ingestionMode === 'digital' ? colors.bg : colors.textDim} />
          <Text style={[styles.modeTabText, ingestionMode === 'digital' && styles.modeTabTextActive]}>
            Digital Material
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, ingestionMode === 'physical' && styles.modeTabActive]}
          onPress={() => setIngestionMode('physical')}
        >
          <BookOpen size={14} color={ingestionMode === 'physical' ? colors.bg : colors.textDim} />
          <Text style={[styles.modeTabText, ingestionMode === 'physical' && styles.modeTabTextActive]}>
            Physical Acquisition
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Templates */}
      <Text style={styles.sectionLabel}>Instant Presets</Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset('past_questions')}>
          <Sparkles size={11} color="#f59e0b" />
          <Text style={styles.presetChipText}>Past Questions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset('handout')}>
          <Sparkles size={11} color="#38bdf8" />
          <Text style={styles.presetChipText}>Lecture Handout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset('physical')}>
          <Sparkles size={11} color="#34d399" />
          <Text style={styles.presetChipText}>Physical Book</Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Resource Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Cooperative Econometrics Manual"
          placeholderTextColor={colors.textDim}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.fieldLabel}>Author / Originating Faculty *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dr. Mrs. F. A. Babalola"
          placeholderTextColor={colors.textDim}
          value={author}
          onChangeText={setAuthor}
        />

        {/* Course Code Chips */}
        <Text style={styles.fieldLabel}>Course Code Mapping</Text>
        <View style={styles.chipsRow}>
          {courseChips.map(code => (
            <TouchableOpacity
              key={code}
              style={[styles.courseChip, courseCode === code && styles.courseChipActive]}
              onPress={() => setCourseCode(code)}
            >
              <Text style={[styles.courseChipText, courseCode === code && styles.courseChipTextActive]}>
                {code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {ingestionMode === 'physical' ? (
          <>
            <Text style={styles.fieldLabel}>ISBN / ISSN</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 978-0198826729"
              placeholderTextColor={colors.textDim}
              value={isbn}
              onChangeText={setIsbn}
            />

            <Text style={styles.fieldLabel}>Publisher</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Oxford Academic Press"
              placeholderTextColor={colors.textDim}
              value={publisher}
              onChangeText={setPublisher}
            />

            <Text style={styles.fieldLabel}>Requested Hardcopy Copies</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              value={requestedCopies}
              onChangeText={setRequestedCopies}
            />
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Resource Type</Text>
            <View style={styles.chipsRow}>
              {['Lecture Handout', 'Past Exam Questions', 'Thesis / Capstone'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.courseChip, resourceType === t && styles.courseChipActive]}
                  onPress={() => setResourceType(t)}
                >
                  <Text style={[styles.courseChipText, resourceType === t && styles.courseChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.fieldLabel}>Syllabus Notes / Abstract</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Outline course alignment for cataloger..."
          placeholderTextColor={colors.textDim}
          multiline
          numberOfLines={3}
          value={abstract}
          onChangeText={setAbstract}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Send size={16} color="#ffffff" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Staging into Review Queue...' : 'Dispatch to Central Library'}
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    marginBottom: 16,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    marginBottom: 8,
  },
  headerBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  successTitle: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  successText: {
    color: colors.text,
    fontSize: 12,
  },
  boldMono: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#34d399',
  },
  statusPending: {
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  successDesc: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: colors.accent,
  },
  modeTabText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: colors.bg,
  },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presetChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  courseChip: {
    backgroundColor: colors.bg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  courseChipActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderColor: colors.accent,
  },
  courseChipText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  courseChipTextActive: {
    color: colors.accent,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitBtnText: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '800',
  },
});
