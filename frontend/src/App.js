import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RSVPForm />} />
        <Route path="/rsvp" element={<RSVPForm />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;