import { useEffect, useState } from 'react';

const useAuthUser = () => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedStudent = localStorage.getItem('student');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedStudent) setStudent(JSON.parse(storedStudent));
  }, []);

  return { user, student };
};

export default useAuthUser;
