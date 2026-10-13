export const ROLE_LABELS = {
  Admin: 'مدیر',
  Technical: 'مسئول فنی',
  Teacher: 'استاد',
  Pupil: 'دانش‌آموز',
  Student: 'دانشجو',
  Parent: 'والدین',
};

export const PANEL_PATHS = {
  Admin: '/panel/admin',
  Technical: '/panel/technical',
  Teacher: '/panel/teacher',
  Pupil: '/panel/pupil',
  Student: '/panel/student',
  Parent: '/panel/parent',
};

const ROLE_ALIASES = {
  SuperAdmin: 'Admin',
  ContentManager: 'Technical',
  Instructor: 'Teacher',
};

export function normalizeRole(role) {
  return ROLE_ALIASES[role] || role;
}

export function getPanelPath(role) {
  return PANEL_PATHS[normalizeRole(role)] || '/dashboard';
}

export function isStaffRole(role) {
  return ['Admin', 'Technical'].includes(normalizeRole(role));
}

export function isTeacherRole(role) {
  return normalizeRole(role) === 'Teacher';
}

export function isLearnerRole(role) {
  return ['Pupil', 'Student'].includes(normalizeRole(role));
}
