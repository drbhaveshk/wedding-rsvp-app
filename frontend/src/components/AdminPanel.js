import React, { useState, useEffect, useCallback } from 'react';
console.log('🎉 UPDATED ADMIN PANEL LOADED - Version 2.0');
import { Upload, Send, Users, CheckCircle, XCircle, Clock, Download, Eye, MessageSquare, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminPanel() {
  const [selectedWedding, setSelectedWedding] = useState('1');
  const [guests, setGuests] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [previewGuest, setPreviewGuest] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Reset state when wedding changes
  useEffect(() => {
    console.log('Wedding changed to:', selectedWedding);
    setGuests([]);
    setTemplateName('');
    setSendResults([]);
    setActiveTab('upload');
    fetchIncomingMessages();
  }, [selectedWedding]);

  // Fetch incoming messages
  const fetchIncomingMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/incoming-messages?weddingId=${selectedWedding}`);
      const result = await response.json();
      
      if (result.success) {
        setIncomingMessages(result.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoadingMessages(false);
  }, [API_URL, selectedWedding]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchIncomingMessages();
    }
  }, [activeTab, fetchIncomingMessages]);

  useEffect(() => {
    if (activeTab !== 'messages') return;
    const interval = setInterval(() => {
      fetchIncomingMessages();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchIncomingMessages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const guestList = jsonData.map((row, index) => ({
        id: index + 1,
        name: row['Guest Name'] || row['Name'] || row['name'] || '',
        phoneNumber: String(row['Phone Number'] || row['Phone'] || row['phone'] || ''),
        status: 'pending'
      }));

      setGuests(guestList);
      alert(`Successfully loaded ${guestList.length} guests for Wedding ${selectedWedding}!`);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please make sure it has columns: "Guest Name" and "Phone Number"');
    }
  };

  const generatePreview = () => {
    if (!templateName.trim() || guests.length === 0) {
      alert('Please enter template name and upload guest list first');
      return;
    }
    setPreviewGuest(guests[0]);
    setShowPreview(true);
  };

  const sendInvitations = async () => {
    if (!templateName.trim()) {
      alert('Please enter Meta WhatsApp template name');
      return;
    }
    if (guests.length === 0) {
      alert('Please upload guest list first');
      return;
    }

    setSending(true);
    setSendResults([]);
    const results = [];

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      
      try {
        const response = await fetch(`${API_URL}/api/whatsapp/send-template-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: guest.phoneNumber,
            guestName: guest.name,
            templateName: templateName,
            templateLanguage: templateLanguage,
            weddingId: selectedWedding
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        results.push({
          guest: guest.name,
          phone: guest.phoneNumber,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        setGuests(prev => prev.map(g => 
          g.id === guest.id ? { ...g, status: result.success ? 'sent' : 'failed' } : g
        ));

        if (i < guests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        results.push({
          guest: guest.name,
          phone: guest.phoneNumber,
          success: false,
          error: error.message
        });
        setGuests(prev => prev.map(g => 
          g.id === guest.id ? { ...g, status: 'failed' } : g
        ));
      }
    }

    setSendResults(results);
    setSending(false);
    setActiveTab('results');
  };

  const downloadTemplate = () => {
    const template = [
      ['Guest Name', 'Phone Number'],
      ['John Doe', '9876543210'],
      ['Jane Smith', '9876543211']
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guest List');
    XLSX.writeFile(wb, `wedding${selectedWedding}-guest-list-template.xlsx`);
  };

  const stats = {
    total: guests.length,
    sent: guests.filter(g => g.status === 'sent').length,
    failed: guests.filter(g => g.status === 'failed').length,
    pending: guests.filter(g => g.status === 'pending').length
  };

  const weddingColors = {
    '1': { bg: '#fce7f3', primary: '#ec4899', secondary: '#a855f7', icon: '💕' },
    '2': { bg: '#dbeafe', primary: '#3b82f6', secondary: '#06b6d4', icon: '💙' },
    '3': { bg: '#d1fae5', primary: '#10b981', secondary: '#059669', icon: '💚' }
  };

  const colors = weddingColors[selectedWedding];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fce7f3, #f3e8ff, #dbeafe)',
      padding: '24px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    selectorBox: {
      backgroundColor: colors.bg,
      padding: '24px',
      borderRadius: '12px',
      border: `3px solid ${colors.primary}`,
      marginTop: '24px'
    },
    select: {
      width: '100%',
      padding: '16px',
      fontSize: '20px',
      fontWeight: 'bold',
      border: '2px solid #333',
      borderRadius: '12px',
      cursor: 'pointer',
      backgroundColor: 'white',
      marginTop: '12px'
    },
    badge: {
      display: 'inline-block',
      marginTop: '16px',
      padding: '12px 24px',
      backgroundColor: colors.primary,
      color: 'white',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '16px'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    tab: {
      flex: 1,
      padding: '16px 24px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      backgroundColor: '#f3f4f6',
      color: '#4b5563',
      transition: 'all 0.3s'
    },
    activeTab: {
      backgroundColor: colors.primary,
      color: 'white'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      padding: '24px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                <Send style={{ width: '32px', height: '32px', color: colors.primary }} />
                Wedding Invitation Manager
              </h1>
              <p style={{ color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
                Upload guest list and send WhatsApp invitations using Meta templates
              </p>
            </div>
            <button onClick={downloadTemplate} style={styles.button}>
              <Download style={{ width: '16px', height: '16px' }} />
              Download Template
            </button>
          </div>

          {/* WEDDING SELECTOR - HIGHLY VISIBLE */}
          <div style={styles.selectorBox}>
            <label style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', display: 'block' }}>
              📋 Select Wedding to Manage
            </label>
            <select
              value={selectedWedding}
              onChange={(e) => {
                console.log('Changing to wedding:', e.target.value);
                setSelectedWedding(e.target.value);
              }}
              style={styles.select}
            >
              <option value="1">🎊 Wedding 1</option>
              <option value="2">🎉 Wedding 2</option>
              <option value="3">🎈 Wedding 3</option>
            </select>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Each wedding has separate guest lists, messages, and Excel files
              </p>
              <span style={styles.badge}>
                Currently: Wedding {selectedWedding} {colors.icon}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Total Guests</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '4px 0 0 0' }}>{stats.total}</p>
              </div>
              <Users style={{ width: '40px', height: '40px', color: colors.primary }} />
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Sent</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: '4px 0 0 0' }}>{stats.sent}</p>
              </div>
              <CheckCircle style={{ width: '40px', height: '40px', color: '#10b981' }} />
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Failed</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444', margin: '4px 0 0 0' }}>{stats.failed}</p>
              </div>
              <XCircle style={{ width: '40px', height: '40px', color: '#ef4444' }} />
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Pending</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '4px 0 0 0' }}>{stats.pending}</p>
              </div>
              <Clock style={{ width: '40px', height: '40px', color: '#f59e0b' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.card}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{ ...styles.tab, ...(activeTab === 'upload' ? styles.activeTab : {}) }}
            >
              <Upload style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
              Configure & Upload
            </button>
            <button
              onClick={() => setActiveTab('guests')}
              style={{ ...styles.tab, ...(activeTab === 'guests' ? styles.activeTab : {}) }}
            >
              <Users style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
              Guest List ({guests.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{ ...styles.tab, ...(activeTab === 'messages' ? styles.activeTab : {}) }}
            >
              <MessageSquare style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
              Messages ({incomingMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              style={{ ...styles.tab, ...(activeTab === 'results' ? styles.activeTab : {}) }}
            >
              <CheckCircle style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
              Results ({sendResults.length})
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {activeTab === 'upload' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Meta WhatsApp Template Configuration - Wedding {selectedWedding}
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    Template Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., wedding_invitation"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    Template Language
                  </label>
                  <select
                    value={templateLanguage}
                    onChange={(e) => setTemplateLanguage(e.target.value)}
                    style={styles.input}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="en_US">English (US)</option>
                    <option value="en_GB">English (UK)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Upload Guest List for Wedding {selectedWedding}
                  </h3>
                  <div style={{ 
                    border: '4px dashed #d1d5db', 
                    borderRadius: '12px', 
                    padding: '48px', 
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}>
                    <Upload style={{ width: '64px', height: '64px', color: '#9ca3af', margin: '0 auto 16px' }} />
                    <label style={{ cursor: 'pointer' }}>
                      <span style={{ fontSize: '18px', color: '#6b7280' }}>
                        Click to upload Excel file
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={generatePreview}
                    disabled={guests.length === 0 || !templateName.trim()}
                    style={{ ...styles.button, flex: 1, justifyContent: 'center', opacity: (guests.length === 0 || !templateName.trim()) ? 0.5 : 1 }}
                  >
                    <Eye style={{ width: '20px', height: '20px' }} />
                    Preview Template
                  </button>
                  <button
                    onClick={sendInvitations}
                    disabled={sending || guests.length === 0 || !templateName.trim()}
                    style={{ ...styles.button, flex: 1, justifyContent: 'center', opacity: (sending || guests.length === 0 || !templateName.trim()) ? 0.5 : 1 }}
                  >
                    <Send style={{ width: '20px', height: '20px' }} />
                    {sending ? 'Sending...' : `Send to All (${guests.length})`}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'guests' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Guest List - Wedding {selectedWedding}
                </h3>
                {guests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                    <Users style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db' }} />
                    <p>No guests uploaded yet for Wedding {selectedWedding}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>S.No</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Guest Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Phone Number</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guests.map((guest) => (
                          <tr key={guest.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>{guest.id}</td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{guest.name}</td>
                            <td style={{ padding: '12px' }}>{guest.phoneNumber}</td>
                            <td style={{ padding: '12px' }}>
                              {guest.status === 'sent' && <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Sent</span>}
                              {guest.status === 'failed' && <span style={{ color: '#ef4444', fontWeight: '600' }}>✗ Failed</span>}
                              {guest.status === 'pending' && <span style={{ color: '#f59e0b', fontWeight: '600' }}>⏳ Pending</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                    Incoming Messages - Wedding {selectedWedding}
                  </h3>
                  <button onClick={fetchIncomingMessages} style={styles.button}>
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Refresh
                  </button>
                </div>
                {incomingMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                    <MessageSquare style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db' }} />
                    <p>No messages yet for Wedding {selectedWedding}</p>
                  </div>
                ) : (
                  <div>
                    {incomingMessages.map((msg, idx) => (
                      <div key={idx} style={{ backgroundColor: colors.bg, padding: '16px', borderRadius: '8px', marginBottom: '12px', border: `2px solid ${colors.primary}` }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{msg.name || 'Unknown'} - {msg.phoneNumber}</p>
                        <p style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', marginBottom: '8px' }}>{msg.messageBody || 'empty message'}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Sending Results - Wedding {selectedWedding}
                </h3>
                {sendResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                    <CheckCircle style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db' }} />
                    <p>No results yet. Send invitations to see results here.</p>
                  </div>
                ) : (
                  <div>
                    {sendResults.map((result, idx) => (
                      <div key={idx} style={{ 
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
                        border: `2px solid ${result.success ? '#10b981' : '#ef4444'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontWeight: 'bold' }}>{result.guest}</p>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>{result.phone}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {result.success ? (
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Sent Successfully</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Failed</span>
                            )}
                            {result.error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{result.error}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewGuest && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Template Preview - Wedding {selectedWedding}</h3>
              <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p><strong>Template:</strong> {templateName}</p>
                <p><strong>Language:</strong> {templateLanguage}</p>
                <p><strong>Sample Guest:</strong> {previewGuest.name}</p>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ ...styles.button, width: '100%', justifyContent: 'center' }}>
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
