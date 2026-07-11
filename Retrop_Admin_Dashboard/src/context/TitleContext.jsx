import React, { createContext, useContext, useState, useEffect } from 'react';

const TitleContext = createContext({
  title: 'Retrop Admin',
  setTitle: () => {}
});

export function TitleProvider({ children }) {
  const [title, setTitle] = useState('Retrop Admin');

  useEffect(() => {
    // Update browser document tab title
    document.title = title ? `${title} | Retrop Admin` : 'Retrop Admin';
  }, [title]);

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
}

export function useTitle(initialTitle) {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error('useTitle must be used within a TitleProvider');
  }

  const { setTitle } = context;

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle, setTitle]);

  return setTitle;
}
