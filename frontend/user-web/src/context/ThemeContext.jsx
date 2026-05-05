import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('blockmyshow-theme');
    if (savedTheme) return savedTheme;
    // Default to dark mode for Web3 aesthetic
    return 'dark';
  });

  useEffect(() => {
    // Set theme attribute on document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('blockmyshow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
