// =========================================================================
// NATURAL LANGUAGE SCHOLARLY SEARCH & PARSER UTILITY
// =========================================================================

export function parseNaturalLanguageQuery(queryString) {
  const query = (queryString || '').trim().toLowerCase();
  
  const result = {
    originalQuery: queryString,
    cleanQuery: query,
    filters: {
      availableOnly: false,
      format: null, // 'pdf', 'book', 'thesis', 'journal', 'dataset'
      subject: null,
      courseCode: null,
      recentYearsOnly: false,
    },
    intent: 'general_search', // 'course_lookup', 'thesis_lookup', 'recommendation', 'citation'
    suggestedTerm: null
  };

  if (!query) return result;

  // Check for availability phrases
  if (query.includes('available') || query.includes('in stock') || query.includes('on shelf') || query.includes('available today')) {
    result.filters.availableOnly = true;
  }

  // Check for format phrases
  if (query.includes('thesis') || query.includes('theses') || query.includes('dissertation') || query.includes('final year project')) {
    result.filters.format = 'thesis';
    result.intent = 'thesis_lookup';
  } else if (query.includes('journal') || query.includes('paper') || query.includes('research') || query.includes('article')) {
    result.filters.format = 'journal';
  } else if (query.includes('pdf') || query.includes('ebook') || query.includes('digital')) {
    result.filters.format = 'pdf';
  } else if (query.includes('course material') || query.includes('past question') || query.includes('syllabus')) {
    result.filters.format = 'course';
    result.intent = 'course_lookup';
  }

  // Check for Course Codes (e.g. CSC 301, EEE 305, CPE 311, CEM 411)
  const courseMatch = query.match(/\b([a-z]{3}\s*\d{3})\b/i);
  if (courseMatch) {
    result.filters.courseCode = courseMatch[1].toUpperCase().replace(/\s+/, ' ');
    result.intent = 'course_lookup';
  }

  // Check for recent publications
  if (query.includes('recent') || query.includes('latest') || query.includes('2024') || query.includes('2025') || query.includes('2026')) {
    result.filters.recentYearsOnly = true;
  }

  // Typo & Suggestion dictionary
  const typoMap = {
    'artifical': 'artificial',
    'inteligence': 'intelligence',
    'cooperative': 'co-operative',
    'econimics': 'economics',
    'pyton': 'python',
    'algoritm': 'algorithm',
    'cybersecrity': 'cybersecurity',
    'data base': 'database',
    'agric': 'agricultural',
    'libary': 'library'
  };

  let cleaned = query;
  Object.keys(typoMap).forEach(typo => {
    if (cleaned.includes(typo)) {
      cleaned = cleaned.replace(new RegExp(`\\b${typo}\\b`, 'g'), typoMap[typo]);
      result.suggestedTerm = cleaned;
    }
  });

  // Extract core keywords by stripping common stop phrases
  const stopPhrases = [
    'find available books about',
    'find books about',
    'find books for',
    'show me books about',
    'show me textbooks about',
    'find recent research papers about',
    'find papers about',
    'find theses written by',
    'show journals about',
    'show me',
    'find me',
    'what are the',
    'books on',
    'papers on',
    'information about',
    'available today',
    'available now',
    'textbooks'
  ];

  let core = query;
  for (const phrase of stopPhrases) {
    if (core.startsWith(phrase)) {
      core = core.slice(phrase.length).trim();
      break;
    }
  }

  result.cleanQuery = core;
  return result;
}

export function filterCatalogByNlp(books, parsedNlp) {
  const { cleanQuery, filters } = parsedNlp;
  const q = cleanQuery.toLowerCase();

  return books.filter(book => {
    // 1. Availability filter
    if (filters.availableOnly && book.copiesAvailable <= 0 && !book.isDigital) {
      return false;
    }

    // 2. Format filter
    if (filters.format === 'pdf' && !book.isDigital) {
      return false;
    }

    // 3. Course Code filter
    if (filters.courseCode && book.courseCode && !book.courseCode.toUpperCase().includes(filters.courseCode)) {
      return false;
    }

    // 4. Recent years filter
    if (filters.recentYearsOnly && book.year && book.year < 2022) {
      return false;
    }

    if (!q) return true;

    // Comprehensive text search across all book metadata
    const searchableText = [
      book.title,
      book.subtitle,
      book.author,
      book.coAuthors,
      book.subject,
      book.department,
      book.courseCode,
      book.callNumber,
      book.isbn,
      book.doi,
      book.publisher,
      book.fileName,
      book.abstract,
      Array.isArray(book.keywords) ? book.keywords.join(' ') : book.keywords
    ].filter(Boolean).join(' ').toLowerCase();

    // 1. Direct substring match
    if (searchableText.includes(q)) return true;

    // 2. Tokenized search (all words match)
    const tokens = q.split(/\s+/).filter(t => t.length > 1);
    if (tokens.length > 1) {
      const allTokensMatch = tokens.every(token => searchableText.includes(token));
      if (allTokensMatch) return true;
    }

    return false;
  });
}
