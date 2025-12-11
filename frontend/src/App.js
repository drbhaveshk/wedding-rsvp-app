import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RSVPForm1 from './components/RSVPForm1';
import RSVPForm2 from './components/RSVPForm2';
import RSVPForm3 from './components/RSVPForm3';
import MultiWeddingAdminPanel from './components/MultiWeddingAdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RSVP Forms */}
        <Route path="/rsvp/wedding1" element={<RSVPForm1 />} />
        <Route path="/rsvp/wedding2" element={<RSVPForm2 />} />
        <Route path="/rsvp/wedding3" element={<RSVPForm3 />} />
        
        {/* Admin Panel */}
        <Route path="/admin" element={<MultiWeddingAdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
