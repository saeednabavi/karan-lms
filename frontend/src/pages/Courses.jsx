import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getCourses } from '../api';
import CourseCard from '../components/CourseCard';

export default function Courses() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getCourses({ limit: 30, q: query || undefined, category: category || undefined, sort })
      .then((res) => setCourses(res.items || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [query, category, sort]);

  return (
    <main className="container my-5" style={{ minHeight: '60vh' }}>
      <h3 className="marker mb-4">دوره های آموزشی</h3>

      <div className="card p-3 shadow-sm mb-4">
        <div className="row g-2">
          <div className="col-12 col-lg-5">
            <input
              className="form-control"
              placeholder="جستجوی دوره..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="col-6 col-lg-3">
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">همه دسته بندی ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name_fa}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-lg-4">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">جدیدترین</option>
              <option value="popular">پرطرفدارترین</option>
              <option value="rating">بالاترین امتیاز</option>
              <option value="price_asc">ارزان ترین</option>
              <option value="price_desc">گران ترین</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">در حال بارگذاری...</div>
        ) : (
          (courses || []).map((c) => <CourseCard key={c.id} course={c} />)
        )}
      </div>
    </main>
  );
}
