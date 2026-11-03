-- =========================================================================
-- FCC SMART LIBRARY & DIGITAL REPOSITORY - BOOK & METADATA REPAIR SCRIPT
-- Database: gsashtub_brainfeels_library
-- =========================================================================

-- 1. Repair specific uploaded book FCC-HOD-9314 (Replace imprint city 'Budapest, 2018.' with genuine title)
UPDATE books 
SET title = 'Basics of Finance',
    subtitle = 'Banking and Finance • Core Curriculum Module',
    subject = 'Banking and Finance',
    department = 'Banking and Finance',
    is_digital = 1,
    copies_available = 10,
    copies_total = 10,
    file_path = 'FCC-HOD-9314.pdf'
WHERE id = 'FCC-HOD-9314';

UPDATE department_uploads 
SET title = 'Basics of Finance',
    department_name = 'Banking and Finance',
    status = 'approved',
    book_id = 'FCC-HOD-9314'
WHERE id = 'FCC-HOD-9314' OR book_id = 'FCC-HOD-9314';

-- 2. Link any department_uploads row whose file_name matches 02.-Basics-of-Finance
UPDATE department_uploads 
SET book_id = 'FCC-HOD-9314',
    title = 'Basics of Finance',
    status = 'approved'
WHERE file_name LIKE '%Basics-of-Finance%';

-- 3. Copy file_data_url from department_uploads to books if missing
UPDATE books b
INNER JOIN department_uploads u ON (b.id = u.book_id OR b.id = u.id)
SET b.file_data_url = u.file_data_url
WHERE (b.file_data_url IS NULL OR b.file_data_url = '') 
  AND (u.file_data_url IS NOT NULL AND u.file_data_url != '');

-- 4. Copy file_data_url from books to department_uploads if missing
UPDATE department_uploads u
INNER JOIN books b ON (b.id = u.book_id OR b.id = u.id)
SET u.file_data_url = b.file_data_url
WHERE (u.file_data_url IS NULL OR u.file_data_url = '') 
  AND (b.file_data_url IS NOT NULL AND b.file_data_url != '');

-- 5. Fix any other books mistakenly titled with 'Budapest, 2018.'
UPDATE books
SET title = 'Basics of Finance'
WHERE title LIKE 'Budapest, 2018%' AND file_name LIKE '%Basics%Finance%';

UPDATE department_uploads
SET title = 'Basics of Finance'
WHERE title LIKE 'Budapest, 2018%' AND file_name LIKE '%Basics%Finance%';

SELECT id, title, author, department, file_name FROM books WHERE id = 'FCC-HOD-9314';
