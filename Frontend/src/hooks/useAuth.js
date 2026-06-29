import { useState, useEffect } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetch('/api/current_user')
      .then(r => r.json())
      .then(data => setUser(data || null))
      .catch(() => setUser(null));
  }, []);

  return user;
}
