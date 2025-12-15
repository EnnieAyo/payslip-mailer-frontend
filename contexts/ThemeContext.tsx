'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setTheme as setCookieTheme, getTheme as getCookieTheme } from '@/lib/cookies';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check cookie and system preference
    const savedTheme = getCookieTheme();
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    console.log('Initial theme:', initialTheme, 'Saved:', savedTheme, 'System:', systemTheme);
    
    setTheme(initialTheme);
    
    // Apply theme class
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    console.log('HTML classes after init:', document.documentElement.className);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      console.log('Toggling theme from', prevTheme, 'to', newTheme);
      
      setCookieTheme(newTheme);
      
      // Apply theme class
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      console.log('HTML classes after toggle:', document.documentElement.className);
      console.log('Cookie set:', getCookieTheme());
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
