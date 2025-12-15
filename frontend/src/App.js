// Quick Test App.js - Replace your App.js with this
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import AdminPanel from './components/AdminPanel';

function App() {
  console.log('✅ NEW APP.JS IS LOADED!');
  console.log('Multi-wedding routes are configured');
  
  return (
    <Router>
      <Routes>
        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/rsvp/wedding1" replace />} />
        <Route path="/rsvp" element={<Navigate to="/rsvp/wedding1" replace />} />
        
        {/* Wedding-specific RSVP routes */}
        <Route path="/rsvp/wedding1" element={<RSVPForm weddingId="1" />} />
        <Route path="/rsvp/wedding2" element={<RSVPForm weddingId="2" />} />
        <Route path="/rsvp/wedding3" element={<RSVPForm weddingId="3" />} />
        
        {/* Admin panel */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* 404 catch-all */}
        <Route path="*" element={
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }}>
            <h1>404 - Page Not Found</h1>
            <p>Available routes:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="/rsvp/wedding1">Wedding 1 RSVP</a></li>
              <li><a href="/rsvp/wedding2">Wedding 2 RSVP</a></li>
              <li><a href="/rsvp/wedding3">Wedding 3 RSVP</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
