import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default routes redirect to wedding 1 */}
        <Route path="/" element={<RSVPForm weddingId="1" />} />
        <Route path="/rsvp" element={<RSVPForm weddingId="1" />} />
        
        {/* Wedding-specific RSVP routes */}
        <Route path="/rsvp/wedding1" element={<RSVPForm weddingId="1" />} />
        <Route path="/rsvp/wedding2" element={<RSVPForm weddingId="2" />} />
        <Route path="/rsvp/wedding3" element={<RSVPForm weddingId="3" />} />
        
        {/* Admin panel route */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
