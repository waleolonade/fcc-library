// =========================================================================
// ACADEMIC DEPARTMENTS MANAGEMENT SERVICE
// Federal Co-operative College, Ibadan (FCC Ibadan)
// Centralized register of Academic Units, HOD Portals, and Course Reserves
// =========================================================================

export const DEFAULT_DEPARTMENTS = [
  {
    id: 'DEP-CEM',
    code: 'CEM',
    name: 'Co-operative Economics & Management',
    faculty: 'School of Cooperative & Management Studies',
    hod: 'Dr. Mrs. F. A. Babalola',
    hodEmail: 'f.babalola@fccibadan.edu.ng',
    hodPhone: '+234 803 234 5678',
    pin: '1234',
    established: 1976,
    levels: ['ND I', 'ND II', 'HND I', 'HND II'],
    studentCount: 420,
    coursesCount: 18,
    curriculumBooksCount: 52,
    hndProjectsCount: 88,
    color: 'emerald',
    description: 'Premier department specializing in cooperative governance, agrarian credit administration, and rural economic development.',
    status: 'Active',
    courses: [
      { code: 'CEM 111', title: 'Principles of Co-operative Economics I', level: 'ND I', books: 4 },
      { code: 'CEM 211', title: 'Co-operative Field Administration & Audits', level: 'ND II', books: 6 },
      { code: 'CEM 311', title: 'Agrarian Micro-Credit & Apex Unions', level: 'HND I', books: 7 },
      { code: 'CEM 411', title: 'Advanced Co-operative Management & Digital E-Commerce', level: 'HND II', books: 9 }
    ]
  },
  {
    id: 'DEP-CSC',
    code: 'CSC',
    name: 'Computer Science & Information Technology',
    faculty: 'School of Applied Sciences & Computing',
    hod: 'Dr. K. E. Okonjo',
    hodEmail: 'k.okonjo@fccibadan.edu.ng',
    hodPhone: '+234 802 876 5432',
    pin: '1234',
    established: 1994,
    levels: ['ND I', 'ND II', 'HND I', 'HND II'],
    studentCount: 360,
    coursesCount: 22,
    curriculumBooksCount: 44,
    hndProjectsCount: 76,
    color: 'teal',
    description: 'Applied computing, systems architecture, library automation, machine learning in educational data mining, and distributed systems.',
    status: 'Active',
    courses: [
      { code: 'CSC 101', title: 'Introduction to Computing & Logic', level: 'ND I', books: 5 },
      { code: 'CSC 201', title: 'Data Structures & Algorithms in Python', level: 'ND II', books: 8 },
      { code: 'CSC 301', title: 'Database Systems & Distributed Architectures', level: 'HND I', books: 6 },
      { code: 'CSC 401', title: 'Software Engineering & Enterprise Web Systems', level: 'HND II', books: 7 }
    ]
  },
  {
    id: 'DEP-BNF',
    code: 'BNF',
    name: 'Banking & Finance',
    faculty: 'School of Financial & Economic Sciences',
    hod: 'Mrs. Folake Sanusi',
    hodEmail: 'f.sanusi@fccibadan.edu.ng',
    hodPhone: '+234 805 112 3344',
    pin: '1234',
    established: 1988,
    levels: ['ND I', 'ND II', 'HND I', 'HND II'],
    studentCount: 290,
    coursesCount: 16,
    curriculumBooksCount: 38,
    hndProjectsCount: 54,
    color: 'indigo',
    description: 'Financial institutions management, fintech lending, regulatory compliance, microfinance banking, and risk modeling in developing markets.',
    status: 'Active',
    courses: [
      { code: 'BNF 112', title: 'Elements of Banking Operations', level: 'ND I', books: 4 },
      { code: 'BNF 212', title: 'Credit Administration & Analysis', level: 'ND II', books: 5 },
      { code: 'BNF 312', title: 'Monetary Policy & Commercial Banking', level: 'HND I', books: 6 },
      { code: 'BNF 412', title: 'Fintech, SME Capital & Microfinance', level: 'HND II', books: 8 }
    ]
  },
  {
    id: 'DEP-AGR',
    code: 'AGR',
    name: 'Agricultural Extension & Management',
    faculty: 'School of Agriculture & Natural Resources',
    hod: 'Dr. A. O. Olabode',
    hodEmail: 'a.olabode@fccibadan.edu.ng',
    hodPhone: '+234 803 998 7766',
    pin: '1234',
    established: 1982,
    levels: ['ND I', 'ND II', 'HND I', 'HND II'],
    studentCount: 240,
    coursesCount: 14,
    curriculumBooksCount: 32,
    hndProjectsCount: 46,
    color: 'amber',
    description: 'Climate-smart agronomy, post-harvest crop preservation technology, participatory extension methods, and cooperative farming schemes.',
    status: 'Active',
    courses: [
      { code: 'AGR 105', title: 'Introduction to Agricultural Science', level: 'ND I', books: 4 },
      { code: 'AGR 205', title: 'Extension Teaching Methods', level: 'ND II', books: 5 },
      { code: 'AGR 305', title: 'Crop Protection & Hermetic Storage Systems', level: 'HND I', books: 5 },
      { code: 'AGR 405', title: 'Agro-Enterprise Incubation & Cooperative Marketing', level: 'HND II', books: 6 }
    ]
  },
  {
    id: 'DEP-BAM',
    code: 'BAM',
    name: 'Business Administration & Management',
    faculty: 'School of Cooperative & Management Studies',
    hod: 'Dr. T. M. Adewale',
    hodEmail: 't.adewale@fccibadan.edu.ng',
    hodPhone: '+234 806 554 3322',
    pin: '1234',
    established: 1985,
    levels: ['ND I', 'ND II', 'HND I', 'HND II'],
    studentCount: 310,
    coursesCount: 17,
    curriculumBooksCount: 40,
    hndProjectsCount: 62,
    color: 'purple',
    description: 'Strategic planning, human capital management, organizational behavior, business ethics, and operations research in enterprise cooperatives.',
    status: 'Active',
    courses: [
      { code: 'BAM 111', title: 'Introduction to Business Organization', level: 'ND I', books: 4 },
      { code: 'BAM 211', title: 'Small Business Enterprise Development', level: 'ND II', books: 6 },
      { code: 'BAM 311', title: 'Strategic Operations & Logistics', level: 'HND I', books: 6 },
      { code: 'BAM 411', title: 'Corporate Governance & Business Policy', level: 'HND II', books: 7 }
    ]
  }
];

const STORAGE_KEY = 'fcc_departments_v48_gov';

export const departmentService = {
  getDepartments: () => {
    if (typeof window === 'undefined') return DEFAULT_DEPARTMENTS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
      return DEFAULT_DEPARTMENTS;
    }
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEPARTMENTS;
    } catch (e) {
      console.error('Failed to parse saved departments:', e);
      return DEFAULT_DEPARTMENTS;
    }
  },

  getDepartmentByCode: (code) => {
    const list = departmentService.getDepartments();
    return list.find(d => d.code.toUpperCase() === (code || '').toUpperCase()) || list[0];
  },

  addDepartment: (dept) => {
    const current = departmentService.getDepartments();
    const code = (dept.code || 'NEW').trim().toUpperCase();

    // Check if code already exists
    if (current.some(d => d.code.toUpperCase() === code)) {
      throw new Error(`A department with code "${code}" already exists in the institution.`);
    }

    const newDepartment = {
      id: `DEP-${code}`,
      code: code,
      name: dept.name?.trim() || 'New Academic Department',
      faculty: dept.faculty?.trim() || 'School of Academic Studies',
      hod: dept.hod?.trim() || 'Department Head',
      hodEmail: dept.hodEmail?.trim() || `hod.${code.toLowerCase()}@fccibadan.edu.ng`,
      hodPhone: dept.hodPhone?.trim() || '+234 800 000 0000',
      pin: dept.pin?.trim() || '1234',
      established: Number(dept.established) || new Date().getFullYear(),
      levels: dept.levels || ['ND I', 'ND II', 'HND I', 'HND II'],
      studentCount: Number(dept.studentCount) || 120,
      coursesCount: Number(dept.coursesCount) || 8,
      curriculumBooksCount: Number(dept.curriculumBooksCount) || 16,
      hndProjectsCount: Number(dept.hndProjectsCount) || 10,
      color: dept.color || 'teal',
      description: dept.description?.trim() || 'Newly registered academic unit in Federal Co-operative College, Ibadan.',
      status: 'Active',
      courses: dept.courses || [
        { code: `${code} 101`, title: `Foundations of ${dept.name || 'Discipline'} I`, level: 'ND I', books: 3 },
        { code: `${code} 201`, title: `Intermediate ${dept.name || 'Discipline'} II`, level: 'ND II', books: 4 },
        { code: `${code} 301`, title: `Advanced Professional Practice`, level: 'HND I', books: 4 },
        { code: `${code} 401`, title: `Dissertation & Practical Projects`, level: 'HND II', books: 5 }
      ]
    };

    const updated = [...current, newDepartment];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch cross-component event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-departments-updated', { detail: updated }));
    }

    return newDepartment;
  },

  updateDepartment: (code, updates) => {
    const current = departmentService.getDepartments();
    const updated = current.map(d => {
      if (d.code.toUpperCase() === code.toUpperCase()) {
        return { ...d, ...updates };
      }
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-departments-updated', { detail: updated }));
    }
    return updated.find(d => d.code.toUpperCase() === code.toUpperCase());
  },

  deleteDepartment: (code) => {
    const current = departmentService.getDepartments();
    if (current.length <= 1) {
      throw new Error('At least one primary department must remain registered in the college.');
    }
    const filtered = current.filter(d => d.code.toUpperCase() !== code.toUpperCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-departments-updated', { detail: filtered }));
    }
    return filtered;
  },

  addCourseToDepartment: (code, newCourse) => {
    const current = departmentService.getDepartments();
    const dept = current.find(d => d.code.toUpperCase() === code.toUpperCase());
    if (!dept) throw new Error(`Department ${code} not found`);
    const courses = dept.courses || [];
    const updatedCourses = [...courses, newCourse];
    return departmentService.updateDepartment(code, {
      courses: updatedCourses,
      coursesCount: updatedCourses.length
    });
  },

  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e.detail);
    window.addEventListener('fcc-departments-updated', handler);
    return () => window.removeEventListener('fcc-departments-updated', handler);
  }
};
