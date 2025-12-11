import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Send, Users, CheckCircle, XCircle, Clock, Download, Eye, MessageSquare, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MultiWeddingAdminPanel() {
  const [selectedWedding, setSelectedWedding] = useState('wedding1');
  const [guests, setGuests] = useState({
    wedding1: [],
    wedding2: [],
    wedding3: []
  });
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState({
    wedding1: [],
    wedding2: [],
    wedding3: []
  });
  const [activeTab, setActiveTab] = useState('upload');
  const [previewGuest, setPreviewGuest] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const weddingOptions = [
    { id: 'wedding1', name: 'Wedding 1', color: 'pink' },
    { id: 'wedding2', name: 'Wedding 2', color: 'purple' },
    { id: 'wedding3', name: 'Wedding 3', color: 'blue' }
  ];

  // Get current wedding's data
  const currentGuests = guests[selectedWedding] || [];
  const currentResults = sendResults[selectedWedding] || [];

  // Fetch incoming messages
  const fetchIncomingMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/incoming-messages`);
      const result = await response.json();
      
      if (result.success) {
        setIncomingMessages(result.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoadingMessages(false);
  }, [API_URL]);

  // Fetch messages when Messages tab is opened
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

  // Handle Excel file upload
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

      setGuests(prev => ({
        ...prev,
        [selectedWedding]: guestList
      }));
      
      alert(`Successfully loaded ${guestList.length} guests for ${weddingOptions.find(w => w.id === selectedWedding)?.name}!`);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please make sure it has columns: "Guest Name" and "Phone Number"');
    }
  };

  // Generate preview
  const generatePreview = () => {
    if (!templateName.trim() || currentGuests.length === 0) {
      alert('Please enter template name and upload guest list first');
      return;
    }

    setPreviewGuest(currentGuests[0]);
    setShowPreview(true);
  };

  // Send invitations
  const sendInvitations = async () => {
    if (!templateName.trim()) {
      alert('Please enter Meta WhatsApp template name');
      return;
    }

    if (currentGuests.length === 0) {
      alert('Please upload guest list first');
      return;
    }

    setSending(true);
    
    const results = [];

    for (let i = 0; i < currentGuests.length; i++) {
      const guest = currentGuests[i];
      
      try {
        console.log(`Sending template to: ${guest.name} (${guest.phoneNumber})`);

        const response = await fetch(`${API_URL}/api/whatsapp/send-template-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: guest.phoneNumber,
            guestName: guest.name,
            templateName: templateName,
            templateLanguage: templateLanguage,
            weddingId: selectedWedding
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        results.push({
          guest: guest.name,
          phone: guest.phoneNumber,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        setGuests(prev => ({
          ...prev,
          [selectedWedding]: prev[selectedWedding].map(g => 
            g.id === guest.id 
              ? { ...g, status: result.success ? 'sent' : 'failed' }
              : g
          )
        }));

        if (i < currentGuests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error('Error sending invitation:', error);
        results.push({
          guest: guest.name,
          phone: guest.phoneNumber,
          success: false,
          error: error.message
        });

        setGuests(prev => ({
          ...prev,
          [selectedWedding]: prev[selectedWedding].map(g => 
            g.id === guest.id 
              ? { ...g, status: 'failed' }
              : g
          )
        }));
      }
    }

    setSendResults(prev => ({
      ...prev,
      [selectedWedding]: results
    }));
    
    setSending(false);
    setActiveTab('results');
  };

  // Download sample Excel template
  const downloadTemplate = () => {
    const template = [
      ['Guest Name', 'Phone Number'],
      ['John Doe', '9876543210'],
      ['Jane Smith', '9876543211'],
      ['Ram Kumar', '9876543212']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guest List');
    XLSX.writeFile(wb, 'guest-list-template.xlsx');
  };

  const stats = {
    total: currentGuests.length,
    sent: currentGuests.filter(g => g.status === 'sent').length,
    failed: currentGuests.filter(g => g.status === 'failed').length,
    pending: currentGuests.filter(g => g.status === 'pending').length
  };

  const currentWedding = weddingOptions.find(w => w.id === selectedWedding);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Wedding Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Send className="w-8 h-8 text-pink-500" />
                Wedding Invitation Manager
              </h1>
              <p className="text-gray-600 mt-2">Upload guest list and send WhatsApp invitations using Meta templates</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* Wedding Selection Dropdown */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Wedding Event:
            </label>
            <select
              value={selectedWedding}
              onChange={(e) => setSelectedWedding(e.target.value)}
              className="w-full md:w-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none font-semibold"
            >
              {weddingOptions.map(wedding => (
                <option key={wedding.id} value={wedding.id}>
                  {wedding.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Each wedding has its own guest list and settings. Common WhatsApp configuration is shared.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Guests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Sent</p>
                <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'upload'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Configure & Upload
            </button>
            <button
              onClick={() => setActiveTab('guests')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'guests'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Guest List ({currentGuests.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'messages'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Messages ({incomingMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'results'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              Results ({currentResults.length})
            </button>
          </div>

          <div className="p-6">
            {/* Configure & Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-pink-800">
                    📋 Currently configuring: <span className="text-lg">{currentWedding?.name}</span>
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Meta WhatsApp Template Configuration</h3>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>📌 Important:</strong> Enter the exact name of your approved Meta WhatsApp template. 
                      The template should have a variable <code className="bg-blue-100 px-2 py-1 rounded">{'{1}'}</code> which will be replaced with the guest name.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., wedding_invitation"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must match your approved template name in Meta</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Template Language
                      </label>
                      <select
                        value={templateLanguage}
                        onChange={(e) => setTemplateLanguage(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="en_US">English (US)</option>
                        <option value="en_GB">English (UK)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Guest List for {currentWedding?.name}</h3>
                  <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-pink-400 transition-colors">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-lg text-gray-600">
                        Click to upload Excel file or drag and drop
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Excel file should have columns: "Guest Name" and "Phone Number"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={generatePreview}
                    disabled={currentGuests.length === 0 || !templateName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-5 h-5" />
                    Preview Template
                  </button>
                  
                  <button
                    onClick={sendInvitations}
                    disabled={sending || currentGuests.length === 0 || !templateName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    {sending ? 'Sending...' : `Send to All (${currentGuests.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* Guest List Tab */}
            {activeTab === 'guests' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Guest List - {currentWedding?.name}</h3>
                {currentGuests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No guests uploaded yet for {currentWedding?.name}.</p>
                    <p className="text-sm mt-2">Please upload an Excel file.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">S.No</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone Number</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentGuests.map((guest) => (
                          <tr key={guest.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{guest.id}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{guest.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{guest.phoneNumber}</td>
                            <td className="px-4 py-3">
                              {guest.status === 'sent' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  <CheckCircle className="w-3 h-3" />
                                  Sent
                                </span>
                              )}
                              {guest.status === 'failed' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                  <XCircle className="w-3 h-3" />
                                  Failed
                                </span>
                              )}
                              {guest.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Incoming WhatsApp Messages (All Weddings)</h3>
                  <button
                    onClick={fetchIncomingMessages}
                    disabled={loadingMessages}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingMessages && incomingMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : incomingMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No messages received yet.</p>
                    <p className="text-sm mt-2">Messages from guests will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingMessages.map((message, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              <p className="font-semibold text-gray-800">
                                {message.name || 'Unknown'}
                              </p>
                              <span className="text-sm text-gray-500">
                                {message.phoneNumber}
                              </span>
                            </div>
                            <div className="bg-white border border-gray-300 rounded-lg p-3 mb-2">
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {message.messageBody || "empty message"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>📅 {new Date(message.timestamp).toLocaleDateString()}</span>
                              <span>🕐 {new Date(message.timestamp).toLocaleTimeString()}</span>
                              {message.messageId && (
                                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                  ID: {message.messageId.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Note:</strong> Messages from all weddings are shown here (common WhatsApp number). 
                    Auto-refreshes every 30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Sending Results - {currentWedding?.name}</h3>
                {currentResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No results yet for {currentWedding?.name}.</p>
                    <p className="text-sm mt-2">Send invitations to see results here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          result.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{result.guest}</p>
                            <p className="text-sm text-gray-600">{result.phone}</p>
                          </div>
                          <div className="text-right">
                            {result.success ? (
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-semibold">Sent Successfully</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-700">
                                <XCircle className="w-5 h-5" />
                                <span className="text-sm font-semibold">Failed</span>
                              </div>
                            )}
                            {result.error && (
                              <p className="text-xs text-red-600 mt-1">{result.error}</p>
                            )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Template Preview - {currentWedding?.name}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Template Name:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{templateName}</code>
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Language:</strong> {templateLanguage}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Sample Guest:</strong> {previewGuest.name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What will be sent:</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Your approved Meta template "<strong>{templateName}</strong>" will be sent to all guests.
                    <br/>
                  <br/>
                  The variable <code className="bg-gray-200 px-2 py-1 rounded">{'{1}'}</code> in your template will be replaced with: <strong>{previewGuest.name}</strong>
                  <br/>
                  <br/>
                  <em className="text-gray-500">Note: The actual message content is controlled by your Meta template.</em>
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="mt-4 w-full px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

