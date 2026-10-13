import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseLearn from './pages/CourseLearn';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import ExamTake from './pages/ExamTake';
import Teachers from './pages/Teachers';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/panels/AdminPanel';
import TechnicalPanel from './pages/panels/TechnicalPanel';
import TeacherPanel from './pages/panels/TeacherPanel';
import PupilDashboard from './pages/panels/PupilDashboard';
import StudentDashboard from './pages/panels/StudentDashboard';
import ParentDashboard from './pages/panels/ParentDashboard';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route
              path="/courses/:id/learn"
              element={(
                <ProtectedRoute>
                  <CourseLearn />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/courses/:id/lessons/:lessonId"
              element={(
                <ProtectedRoute>
                  <CourseLearn />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            />
            <Route path="/exams" element={<Exams />} />
            <Route
              path="/exams/:id/take"
              element={(
                <ProtectedRoute>
                  <ExamTake />
                </ProtectedRoute>
              )}
            />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/panel/admin"
              element={(
                <RoleRoute roles={['Admin', 'SuperAdmin']}>
                  <AdminPanel />
                </RoleRoute>
              )}
            />
            <Route
              path="/panel/technical"
              element={(
                <RoleRoute roles={['Technical', 'ContentManager']}>
                  <TechnicalPanel />
                </RoleRoute>
              )}
            />
            <Route
              path="/panel/teacher"
              element={(
                <RoleRoute roles={['Teacher', 'Instructor']}>
                  <TeacherPanel />
                </RoleRoute>
              )}
            />
            <Route
              path="/panel/pupil"
              element={(
                <RoleRoute roles={['Pupil']}>
                  <PupilDashboard />
                </RoleRoute>
              )}
            />
            <Route
              path="/panel/student"
              element={(
                <RoleRoute roles={['Student']}>
                  <StudentDashboard />
                </RoleRoute>
              )}
            />
            <Route
              path="/panel/parent"
              element={(
                <RoleRoute roles={['Parent']}>
                  <ParentDashboard />
                </RoleRoute>
              )}
            />
            <Route path="/manager" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
