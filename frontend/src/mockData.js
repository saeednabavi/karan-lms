export const DEFAULT_COURSE_IMAGE = '/images/seed/course-default.svg';

export const MOCK_COURSES = [
  { id: '1', title: 'ریاضی پایه پنجم', description: 'آموزش جامع ریاضی پایه پنجم با مثال‌های کاربردی.', teacher: 'پریسا خزایی', rating: 4.5, students: 245, price: 1200000, is_free: false, image_url: '/images/seed/course-math.svg' },
  { id: '2', title: 'علوم پایه ششم', description: 'یادگیری علوم با روش‌های نوین.', teacher: 'محمد رضایی', rating: 5, students: 180, price: 950000, is_free: false, image_url: '/images/seed/course-science.svg' },
  { id: '3', title: 'آموزش جامع جاوااسکریپت', description: 'از پایه تا مفاهیم پیشرفته با مثال‌های واقعی.', teacher: 'پریسا خزایی', rating: 4, students: 310, price: 950000, is_free: false, image_url: '/images/seed/course-programming.svg' },
  { id: '4', title: 'طراحی رابط کاربری (UI/UX)', description: 'یادگیری طراحی رابط و تجربه کاربری.', teacher: 'سارا احمدی', rating: 5, students: 180, price: 750000, is_free: false, image_url: '/images/seed/course-english.svg' },
];

export const MOCK_TEACHERS = [
  { id: '1', full_name: 'پریسا خزایی', title: 'مدرس ریاضی و منطق', bio: '۸ سال سابقه تدریس', avatar_url: '/images/seed/teacher-1.svg' },
  { id: '2', full_name: 'محمد رضایی', title: 'مدرس علوم', bio: 'تخصص در آموزش مفهومی', avatar_url: '/images/seed/teacher-2.svg' },
  { id: '3', full_name: 'سارا احمدی', title: 'مدرس زبان انگلیسی', bio: 'مدرک TESOL', avatar_url: '/images/seed/teacher-3.svg' },
];

export const MOCK_ARTICLES = [
  { id: '1', title: 'چطور بهتر درس بخوانیم؟', slug: 'article-1', excerpt: 'مهارت مطالعه', body: 'روش‌های افزایش تمرکز', image_url: '/images/seed/article-1.svg' },
  { id: '2', title: 'مدیریت استرس در آزمون', slug: 'article-2', excerpt: 'روانشناسی آموزشی', body: 'راهکارهای کاهش اضطراب', image_url: '/images/seed/article-2.svg' },
  { id: '3', title: 'برنامه‌ریزی اصولی درسی', slug: 'article-3', excerpt: 'برنامه‌ریزی', body: 'مسیر درست پیشرفت تحصیلی', image_url: '/images/seed/article-3.svg' },
];

export const MOCK_EXAMS = [
  { id: '1', title: 'ریاضی پایه پنجم - فصل ۱', level: 'پایه ۵', question_count: 20, duration_minutes: 25, status: 'فعال', tag: 'school' },
  { id: '2', title: 'علوم پایه پنجم - فصل ۲', level: 'پایه ۵', question_count: 15, duration_minutes: 20, status: 'فعال', tag: 'school' },
  { id: '3', title: 'نمونه آزمون تیزهوشان (عمومی)', level: 'ورودی', question_count: 30, duration_minutes: 40, status: 'فعال', tag: 'entrance' },
  { id: '4', title: 'واژگان انگلیسی (سطح مقدماتی)', level: 'مهارت', question_count: 20, duration_minutes: 20, status: 'فعال', tag: 'skills' },
];

export const MOCK_ABOUT = {
  title: 'کران بالا',
  mission: 'فراهم‌کردن آموزش باکیفیت، قابل فهم و کاربردی.',
  vision: 'تبدیل‌شدن به یکی از معتبرترین پلتفرم‌های آموزش آنلاین فارسی.',
};
