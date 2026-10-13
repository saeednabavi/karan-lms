const BASE = '/images/seed';

export const COURSE_IMAGES = {
  math: `${BASE}/course-math.svg`,
  science: `${BASE}/course-science.svg`,
  english: `${BASE}/course-english.svg`,
  programming: `${BASE}/course-programming.svg`,
  default: `${BASE}/course-default.svg`,
};

const TITLE_RULES = [
  { pattern: /ریاض|math|آمار|احتمال/i, key: 'math' },
  { pattern: /علوم|science/i, key: 'science' },
  { pattern: /انگلی|english|گرامر|واژگان/i, key: 'english' },
  { pattern: /برنامه|program|پایتون|python|جاوا|javascript|js/i, key: 'programming' },
];

/** Never use broken external CDN URLs — always local placeholder. */
export function resolveCourseImageUrl(course) {
  const url = (course?.image_url || '').trim();
  if (url.startsWith('/images/')) {
    return url;
  }

  const slug = course?.category_slug || course?.category;
  if (slug && COURSE_IMAGES[slug]) {
    return COURSE_IMAGES[slug];
  }

  const title = course?.title || '';
  for (const { pattern, key } of TITLE_RULES) {
    if (pattern.test(title)) {
      return COURSE_IMAGES[key];
    }
  }

  return COURSE_IMAGES.default;
}

export const PLACEHOLDER_COLORS = {
  math: '#2563eb',
  science: '#059669',
  english: '#dc2626',
  programming: '#7c3aed',
  default: '#475569',
};

export function placeholderColorForCourse(course) {
  const url = resolveCourseImageUrl(course);
  if (url.includes('math')) return PLACEHOLDER_COLORS.math;
  if (url.includes('science')) return PLACEHOLDER_COLORS.science;
  if (url.includes('english')) return PLACEHOLDER_COLORS.english;
  if (url.includes('programming')) return PLACEHOLDER_COLORS.programming;
  return PLACEHOLDER_COLORS.default;
}
