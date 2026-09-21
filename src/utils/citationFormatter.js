// =========================================================================
// CITATION FORMATTER UTILITY (APA, MLA, Chicago, Harvard, IEEE, BibTeX, RIS)
// =========================================================================

export function formatCitation(item, style = 'APA') {
  const author = item.author || 'Anonymous';
  const title = item.title || 'Untitled Document';
  const year = item.year || new Date().getFullYear();
  const publisher = item.publisher || 'Federal Co-operative College Academic Press';
  const doi = item.doi ? `https://doi.org/${item.doi}` : '';
  const journal = item.journal || 'Nigerian Journal of Co-operative Economics & Management';
  const volume = item.volume || '14';
  const issue = item.issue || '2';
  const pages = item.pages || '45-62';
  const url = item.url || item.externalUrl || `https://library.fccibadan.edu.ng/records/${item.id || 'FCC-REF'}`;

  // Split author name for family, given
  const authorParts = author.split(' ');
  const lastName = authorParts[authorParts.length - 1];
  const firstInitial = authorParts[0] ? authorParts[0][0] + '.' : '';

  switch (style.toUpperCase()) {
    case 'APA':
      return `${lastName}, ${firstInitial} (${year}). ${title}. ${publisher}.${doi ? ' ' + doi : ''}`;
    case 'MLA':
      return `${lastName}, ${authorParts.slice(0, -1).join(' ')}. "${title}." ${journal ? journal + ', vol. ' + volume + ', no. ' + issue + ', ' + year + ', pp. ' + pages + '.' : publisher + ', ' + year + '.'}${doi ? ' DOI: ' + item.doi : ''}`;
    case 'CHICAGO':
      return `${lastName}, ${authorParts.slice(0, -1).join(' ')}. ${year}. "${title}." ${publisher}.${doi ? ' ' + doi : ''}`;
    case 'HARVARD':
      return `${lastName}, ${firstInitial}, ${year}. ${title}. Ibadan: ${publisher}.${doi ? ' Available at: ' + doi : ''}`;
    case 'IEEE':
      return `[1] ${firstInitial} ${lastName}, "${title}," ${journal ? journal + ', vol. ' + volume + ', no. ' + issue + ', pp. ' + pages + ', ' + year : publisher + ', ' + year}.${doi ? ' doi: ' + item.doi : ''}`;
    case 'BIBTEX':
      const citeKey = `${lastName.toLowerCase()}${year}${title.slice(0, 4).toLowerCase().replace(/[^a-z]/g, '')}`;
      return `@article{${citeKey},
  author    = {${author}},
  title     = {${title}},
  journal   = {${journal}},
  year      = {${year}},
  volume    = {${volume}},
  number    = {${issue}},
  pages     = {${pages}},
  publisher = {${publisher}},
  doi       = {${item.doi || ''}},
  url       = {${url}}
}`;
    case 'RIS':
      return `TY  - JOUR
AU  - ${author}
TI  - ${title}
JO  - ${journal}
PY  - ${year}
VL  - ${volume}
IS  - ${issue}
SP  - ${pages.split('-')[0] || 1}
EP  - ${pages.split('-')[1] || 20}
PB  - ${publisher}
DO  - ${item.doi || ''}
UR  - ${url}
ER  - `;
    default:
      return `${author} (${year}). ${title}. ${publisher}.`;
  }
}

export function downloadCitationFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
