import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { invalidateCache } from '../api/cache';

const AuthContext = createContext();

axios.defaults.baseURL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (token) await axios.post('/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken('');
      setUser(null);
      invalidateCache();
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/me')
        .then(res => {
          if (isMounted) setUser(res.data.user);
        })
        .catch(() => {
          if (isMounted) logout();
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      // Wrap in Promise/queueMicrotask to prevent synchronous setState inside useEffect error
      Promise.resolve().then(() => {
        if (isMounted) setLoading(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    const res = await axios.post('/login', { email, password });
    const { access_token, user } = res.data;

    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    invalidateCache();

    setToken(access_token);
    setUser(user);
    return user;
  };

  const loginWithToken = useCallback((newToken, nextUser) => {
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    invalidateCache();
    if (nextUser) setUser(nextUser);
    setToken(newToken);
  }, []);

  const updateProfile = async (data) => {
    const res = data instanceof FormData
      ? await axios.post('/profile', (() => {
        if (!data.has('_method')) {
          data.append('_method', 'PUT');
        }
        return data;
      })())
      : await axios.put('/profile', data);
    setUser(res.data.user);
    return res.data;
  };

  const changePassword = async (data) => {
    const res = await axios.put('/password', data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithToken, logout, loading, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
