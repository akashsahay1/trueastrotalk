
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Starting application...');

// Get the root element
const rootElement = document.getElementById("root");

if (rootElement) {
  console.log('Root element found, creating React root...');
  
  // Create root with React 18
  const root = createRoot(rootElement);
  
  console.log('About to render App component...');
  
  // Render the app without StrictMode to avoid dispatcher issues
  root.render(<App />);
  
  console.log('App rendered successfully');
} else {
  console.error('Root element not found');
}
