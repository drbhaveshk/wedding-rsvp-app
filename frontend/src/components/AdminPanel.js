import React, { useState } from 'react';
import * as XLSX from "xlsx";
import { Upload, Send, Users, CheckCircle, XCircle, Clock, Download, Eye, MessageSquare } from 'lucide-react';

export default function AdminPanel() {
  const [guests, setGuests] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [invitationFile, setInvitationFile] = useState(null);
  const [invitationPreview, setInvitationPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [previewMessage, setPreviewMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Handle invitation file upload
  const handleInvitationUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload only JPG, PNG, or PDF files');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setInvitationFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvitationPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setInvitationPreview('pdf');
    }
  };

  // Remove invitation file
  const removeInvitationFile = () => {
    setInvitationFile(null);
    setInvitationPreview('');
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map the data to our format
      const guestList = jsonData.map((row, index) => ({
        id: index + 1,
        name: row['Guest Name'] || row['Name'] || row['name'] || '',
        phoneNumber: String(row['Phone Number'] || row['Phone'] || row['phone'] || ''),
        status: 'pending'
      }));

      setGuests(guestList);
      alert(`Successfully loaded ${guestList.length} guests!`);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please make sure it has columns: "Guest Name" and "Phone Number"');
    }
  };

  // Generate preview message
  const generatePreviewMessage = () => {
    if (!customMessage.trim() || guests.length === 0) {
      alert('Please write a custom message and upload guest list first');
      return;
    }

    const sampleGuest = guests[0];
    // Replace {1} placeholder with actual guest name
    const personalizedMessage = customMessage.replace(/\{1}/gi, sampleGuest.name);

    setPreviewMessage(personalizedMessage);
    setShowPreview(true);
  };

  // Send invitations to all guests
  const sendInvitations = async () => {
    if (!customMessage.trim()) {
      alert('Please write a custom message');
      return;
    }

    if (guests.length === 0) {
      alert('Please upload guest list first');
      return;
    }

    setSending(true);
    setSendResults([]);

    const results = [];
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      
      try {
        // Replace {1} with actual guest name
        const personalizedMessage = customMessage.replace(/\{1}/gi, guest.name);

        // Prepare form data for file upload
        const formData = new FormData();
        formData.append('phoneNumber', guest.phoneNumber);
        formData.append('guestName', guest.name);
        formData.append('message', personalizedMessage);
        
        if (invitationFile) {
          formData.append('invitationFile', invitationFile);
        }

        console.log('Sending to:', `${API_URL}/api/whatsapp/send-invitation`);

        const response = await fetch(`${API_URL}/api/whatsapp/send-invitation`, {
          method: 'POST',
          body: formData
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

        // Update guest status
        setGuests(prev => prev.map(g => 
          g.id === guest.id 
            ? { ...g, status: result.success ? 'sent' : 'failed' }
            : g
        ));

        // Add delay between messages (2 seconds)
        if (i < guests.length - 1) {
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

        setGuests(prev => prev.map(g => 
          g.id === guest.id 
            ? { ...g, status: 'failed' }
            : g
        ));
      }
    }

    setSendResults(results);
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
    total: guests.length,
    sent: guests.filter(g => g.status === 'sent').length,
    failed: guests.filter(g => g.status === 'failed').length,
    pending: guests.filter(g => g.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-pink-500" />
                Wedding Invitation Manager
              </h1>
              <p className="text-gray-600 mt-2">Upload guest list and send WhatsApp invitations</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
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
              Upload & Configure
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
              Guest List ({guests.length})
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
              Results ({sendResults.length})
            </button>
          </div>

          <div className="p-6">
            {/* Upload & Configure Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Custom Message</h3>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Write your custom invitation message here...&#10;&#10;Use {1} to personalize with guest name.&#10;&#10;Example:&#10;🎉 Wedding Invitation 🎉&#10;&#10;Dear {name},&#10;&#10;You are cordially invited to celebrate our special day!&#10;&#10;Date: 15th February 2025&#10;Time: 6:00 PM&#10;Venue: Grand Hotel, Mumbai&#10;&#10;We look forward to celebrating with you! 💕"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows="12"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400 focus:outline-none resize-none font-mono text-sm"
                    />
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Use <code className="bg-blue-100 px-2 py-1 rounded">{'{name}'}</code> in your message to automatically insert each guest's name.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Attach Invitation Card (Optional)</h3>
                  {!invitationFile ? (
                    <div className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <label className="cursor-pointer">
                        <span className="text-lg text-gray-600">
                          Click to upload invitation card (JPG, PNG, or PDF)
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleInvitationUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        Maximum file size: 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {invitationPreview === 'pdf' ? (
                            <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center">
                              <span className="text-red-600 font-bold text-2xl">PDF</span>
                            </div>
                          ) : (
                            <img 
                              src={invitationPreview} 
                              alt="Invitation preview" 
                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{invitationFile.name}</p>
                            <p className="text-sm text-gray-600">
                              {(invitationFile.size / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-sm text-green-600 mt-1">✓ Ready to send</p>
                          </div>
                        </div>
                        <button
                          onClick={removeInvitationFile}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Guest List</h3>
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
                    onClick={generatePreviewMessage}
                    disabled={guests.length === 0 || !customMessage.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-5 h-5" />
                    Preview Message
                  </button>
                  
                  <button
                    onClick={sendInvitations}
                    disabled={sending || guests.length === 0 || !customMessage.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    {sending ? 'Sending...' : `Send to All (${guests.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* Guest List Tab */}
            {activeTab === 'guests' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Guest List</h3>
                {guests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No guests uploaded yet. Please upload an Excel file.</p>
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
                        {guests.map((guest) => (
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

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Sending Results</h3>
                {sendResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No results yet. Send invitations to see results here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sendResults.map((result, index) => (
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
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Message Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap font-mono text-sm">
                {previewMessage}
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

      {/* Include SheetJS library */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    </div>
  );
}
