import { placeholderColorForCourse, resolveCourseImageUrl } from '../utils/courseImages';

const CATEGORY_LABELS = {
  math: 'ریاضی',
  science: 'علوم',
  english: 'زبان',
  programming: 'برنامه‌نویسی',
  default: 'دوره آموزشی',
};

function categoryKeyFromUrl(url) {
  if (url.includes('math')) return 'math';
  if (url.includes('science')) return 'science';
  if (url.includes('english')) return 'english';
  if (url.includes('programming')) return 'programming';
  return 'default';
}

function categoryIcon(key) {
  const icons = {
    math: '∑',
    science: '⚗',
    english: 'Aa',
    programming: '</>',
    default: '📚',
  };
  return icons[key] || icons.default;
}

/** Always renders a local placeholder — never loads external/broken URLs. */
export default function CourseThumbnail({ course, className = 'card-img-top', style }) {
  const src = resolveCourseImageUrl(course);
  const key = categoryKeyFromUrl(src);
  const bg = placeholderColorForCourse(course);
  const label = CATEGORY_LABELS[key];
  const title = (course?.title || 'دوره').slice(0, 28);

  return (
    <div
      className={className}
      role="img"
      aria-label={course?.title || 'دوره'}
      style={{
        minHeight: 160,
        background: `linear-gradient(145deg, ${bg} 0%, ${bg}99 45%, ${bg}cc 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          fontSize: '2.25rem',
          lineHeight: 1,
          marginBottom: '0.5rem',
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {categoryIcon(key)}
      </span>
      <span style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4 }}>{title}</span>
    </div>
  );
}
