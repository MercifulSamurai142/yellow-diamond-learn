// yellow-diamond-learn-main/src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the supported languages
type Language = 'english' | 'hindi' | 'kannada';

// Define the shape of the language context
interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
}

// Create the context with an undefined default value, as it will be provided by the Provider
// FIX: Export LanguageContext
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with a value from localStorage or default to 'english'
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem('appLanguage');
    return (storedLang as Language) || 'english';
  });

  // Effect to save the current language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appLanguage', currentLanguage);
  }, [currentLanguage]);

  // Function to update the language
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  // Provide the current language and the setter function to children components
  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to consume the LanguageContext
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};