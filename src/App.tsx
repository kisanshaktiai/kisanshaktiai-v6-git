
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MobileApp } from '@/components/mobile/MobileApp';
import { NotFound } from '@/components/ui/NotFound';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Redirect root to mobile dashboard */}
        <Route path="/" element={<Navigate to="/mobile" replace />} />
        
        {/* Mobile app routes */}
        <Route path="/mobile/*" element={<MobileApp />} />

        {/* Fallback routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
