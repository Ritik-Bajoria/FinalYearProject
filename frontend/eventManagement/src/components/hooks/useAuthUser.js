// hooks/useAuthUser.js
import { useState, useEffect, useCallback, useRef } from 'react';

const useAuthUser = () => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const loadUser = useCallback(() => {
    try {
      if (!isMountedRef.current) return;
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const studentData = localStorage.getItem('student');
      const facultyData = localStorage.getItem('faculty');
      const adminData = localStorage.getItem('admin');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        const userWithRole = {
          ...parsedUser,
          // Determine role based on which additional data exists
          role: adminData ? 'admin' : 
                facultyData ? 'faculty' : 
                studentData ? 'student' : 
                parsedUser.role,
          user_id: parsedUser.user_id || parsedUser.id
        };
        
        if (isMountedRef.current) {
          setUser(userWithRole);
          
          // Set the specific user type data
          if (studentData) {
            setStudent(JSON.parse(studentData));
          } else {
            setStudent(null);
          }
          
          if (facultyData) {
            setFaculty(JSON.parse(facultyData));
          } else {
            setFaculty(null);
          }
          
          if (adminData) {
            setAdmin(JSON.parse(adminData));
          } else {
            setAdmin(null);
          }
          
          setError(null);
        }
      } else {
        if (isMountedRef.current) {
          setUser(null);
          setStudent(null);
          setFaculty(null);
          setAdmin(null);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (isMountedRef.current) {
        setUser(null);
        setStudent(null);
        setFaculty(null);
        setAdmin(null);
        setError(error.message || 'Failed to load user data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'student' || 
          e.key === 'faculty' || e.key === 'admin') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('student');
    localStorage.removeItem('faculty');
    localStorage.removeItem('admin');
    localStorage.removeItem('userRole');
    
    if (isMountedRef.current) {
      setUser(null);
      setStudent(null);
      setFaculty(null);
      setAdmin(null);
      setError(null);
    }
  }, []);

  const refreshUser = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(true);
      loadUser();
    }
  }, [loadUser]);

  // Determine the current user role
  const userRole = user?.role || 
                  (admin ? 'admin' : 
                   faculty ? 'faculty' : 
                   student ? 'student' : null);

  return {
    user,
    student,
    faculty,
    admin,
    userRole,
    loading,
    error,
    logout,
    refreshUser,
    isAuthenticated: !!user
  };
};

export default useAuthUser;