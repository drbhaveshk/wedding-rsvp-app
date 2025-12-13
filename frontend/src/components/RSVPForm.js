import React, { useState } from 'react';
import { Heart, Calendar, User, Upload, CheckCircle, Users, X } from 'lucide-react';

export default function RSVPForm({ weddingId = '1' }) {
  const [formData, setFormData] = useState({
    guestName: '',
    arrivalDate: '',
    departureDate: '',
    numberOfGuests: '',
    attending: '',
    aadharFiles: []
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aadharPreviews, setAadharPreviews] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Add new files to existing files
    const newFiles = [...formData.aadharFiles, ...files];
    setFormData(prev => ({
      ...prev,
      aadharFiles: newFiles
    }));

    // Create previews for all files
    const newPreviews = [...aadharPreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          file: file,
          preview: reader.result,
          name: file.name
        });
        setAadharPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    const newFiles = formData.aadharFiles.filter((_, i) => i !== index);
    const newPreviews = aadharPreviews.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      aadharFiles: newFiles
    }));
    setAadharPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    // Validate mandatory fields
    if (!formData.guestName || !formData.attending) {
      alert('Please fill all mandatory fields: Name and Attendance');
      return;
    }

    // Only require number of guests if attending is 'yes' or 'maybe'
    if ((formData.attending === 'yes' || formData.attending === 'maybe') && !formData.numberOfGuests) {
      alert('Please enter the number of guests if you are attending or might attend');
      return;
    }

    // Only require Aadhar if attending is 'yes' or 'maybe'
    if ((formData.attending === 'yes' || formData.attending === 'maybe') && formData.aadharFiles.length === 0) {
      alert('Please upload at least one Aadhar document if you are attending or might attend');
      return;
    }

    // Validate number of guests if provided
    if (formData.numberOfGuests && formData.numberOfGuests < 1) {
      alert('Number of guests must be at least 1');
      return;
    }

    setLoading(true);

    try {
      // Convert all files to base64
      let base64Files = [];
      if (formData.aadharFiles.length > 0) {
        const filePromises = formData.aadharFiles.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        base64Files = await Promise.all(filePromises);
      }

      const rsvpData = {
        weddingId: weddingId,
        guestName: formData.guestName,
        arrivalDate: formData.arrivalDate || null,
        departureDate: formData.departureDate || null,
        numberOfGuests: formData.numberOfGuests ? parseInt(formData.numberOfGuests) : null,
        attending: formData.attending,
        aadharImages: base64Files,
        timestamp: new Date().toISOString()
      };

      console.log('RSVP Data:', rsvpData);

      // Send to backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/rsvp/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        alert('Error submitting RSVP. Please try again.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Error submitting RSVP. Please try again.');
      setLoading(false);
    }
  };

  // Wedding-specific colors
  const weddingThemes = {
    '1': {
      gradient: 'from-pink-50 via-purple-50 to-blue-50',
      primary: 'pink-500',
      secondary: 'purple-500',
      accent: 'pink-400',
      title: '💕 Wedding 1'
    },
    '2': {
      gradient: 'from-blue-50 via-cyan-50 to-teal-50',
      primary: 'blue-500',
      secondary: 'cyan-500',
      accent: 'blue-400',
      title: '💙 Wedding 2'
    },
    '3': {
      gradient: 'from-green-50 via-emerald-50 to-lime-50',
      primary: 'green-500',
      secondary: 'emerald-500',
      accent: 'green-400',
      title: '💚 Wedding 3'
    }
  };

  const theme = weddingThemes[weddingId] || weddingThemes['1'];

  if (submitted) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your RSVP for {theme.title} has been successfully submitted.</p>
          </div>
          <div className={`bg-${theme.primary} bg-opacity-10 rounded-lg p-4 mb-6`}>
            <p className="text-sm text-gray-700">
              We have received your response and will send you further details via email and WhatsApp.
            </p>
          </div>
          <Heart className={`w-12 h-12 text-${theme.primary} mx-auto animate-pulse`} />
        </div>
      </div>
    );
  }

  // Check if fields are required based on attendance
  const isAadharRequired = formData.attending === 'yes' || formData.attending === 'maybe';
  const isGuestsRequired = formData.attending === 'yes' || formData.attending === 'maybe';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} py-8 px-4`}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <div className="mb-6">
            <Heart className={`w-16 h-16 text-${theme.primary} mx-auto mb-4 animate-pulse`} />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">You're Invited!</h1>
            <p className="text-xl text-gray-600">Join us in celebrating {theme.title}</p>
            <div className={`inline-block mt-3 px-4 py-2 bg-${theme.primary} bg-opacity-20 rounded-full`}>
              <span className="text-sm font-semibold text-gray-700">{theme.title}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">RSVP</h2>
          <div className="space-y-6">
            {/* Guest Name - MANDATORY */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Guest Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={(e) => handleInputChange(e.target)}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-${theme.accent} focus:outline-none transition-colors`}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Number of Guests - Conditionally MANDATORY */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests {isGuestsRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs">(Optional)</span>}
              </label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={(e) => handleInputChange(e.target)}
                min="1"
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-${theme.accent} focus:outline-none transition-colors`}
                placeholder={isGuestsRequired ? "How many people will attend?" : "How many people (optional)"}
                required={isGuestsRequired}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isGuestsRequired 
                  ? 'Required if attending' 
                  : 'Not required if you\'re not attending'}
              </p>
            </div>

            {/* Date of Arrival - OPTIONAL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Arrival <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={(e) => handleInputChange(e.target)}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-${theme.accent} focus:outline-none transition-colors`}
              />
            </div>

            {/* Date of Departure - OPTIONAL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Departure <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={(e) => handleInputChange(e.target)}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-${theme.accent} focus:outline-none transition-colors`}
              />
            </div>

            {/* Attending - MANDATORY */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Will you be attending? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={formData.attending === 'yes'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                    required
                  />
                  <span className="text-gray-700 font-medium">✅ Yes, I'll be there!</span>
                </label>
                <label className="flex items-center cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-yellow-300 transition-colors">
                  <input
                    type="radio"
                    name="attending"
                    value="maybe"
                    checked={formData.attending === 'maybe'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 font-medium">🤔 Maybe, not sure yet</span>
                </label>
                <label className="flex items-center cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={formData.attending === 'no'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 font-medium">❌ Sorry, can't make it</span>
                </label>
              </div>
            </div>

            {/* Aadhar Upload - Conditionally MANDATORY based on attendance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Aadhar Documents {isAadharRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs">(Optional)</span>}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                multiple
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-${theme.accent} focus:outline-none transition-colors`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isAadharRequired 
                  ? 'Required if attending. You can upload multiple files.' 
                  : 'Not required if you\'re not attending. You can upload multiple files.'}
              </p>
              
              {/* File Previews */}
              {aadharPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {aadharPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview.preview} 
                        alt={`Aadhar ${index + 1}`} 
                        className="w-full h-32 object-cover border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mandatory Fields Note */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Fields marked with <span className="text-red-500">*</span> are mandatory.
                {formData.attending === 'no' 
                  ? ' Since you\'re not attending, only your name and attendance status are required.'
                  : isGuestsRequired 
                    ? ' Number of guests and Aadhar documents are required if you are attending or might attend.'
                    : ' Arrival and departure dates are optional.'}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-${theme.primary} to-${theme.secondary} text-white font-semibold py-4 rounded-lg hover:from-${theme.secondary} hover:to-${theme.primary} transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>Thank you for being part of our special day! 💕</p>
        </div>
      </div>
    </div>
  );
}
