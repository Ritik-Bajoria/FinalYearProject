import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
// import FacultyDashboard from './components/facultyDashboard';
import StudentDashboard from './components/pages/StudentDashboard';
import AdminDashboard from './components/pages/AdminDashboard';
import './App.css';
import EventDashboard from './components/pages/EventDashboard';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />
        <Route path="/events/:eventId" element={<EventDashboard />} />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
      </Routes>
    </div>
  );
}

export default App;