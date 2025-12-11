// filepath: RSVPForm2.js
import React, { useState } from 'react';
import { Heart, Calendar, User, Upload, CheckCircle, Users, X } from 'lucide-react';

export default function RSVPForm2() {
  const WEDDING_ID = 'wedding2';
  const WEDDING_NAME = 'Wedding 2';

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

    const newFiles = [...formData.aadharFiles, ...files];
    setFormData(prev => ({ ...prev, aadharFiles: newFiles }));

    const newPreviews = [...aadharPreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          file,
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

    setFormData(prev => ({ ...prev, aadharFiles: newFiles }));
    setAadharPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.guestName || !formData.attending) {
      alert('Please fill all mandatory fields: Name and Attendance');
      return;
    }

    if ((formData.attending === 'yes' || formData.attending === 'maybe') && !formData.numberOfGuests) {
      alert('Please enter the number of guests if you are attending or might attend');
      return;
    }

    if ((formData.attending === 'yes' || formData.attending === 'maybe') && formData.aadharFiles.length === 0) {
      alert('Please upload at least one Aadhar document if you are attending or might attend');
      return;
    }

    if (formData.numberOfGuests && formData.numberOfGuests < 1) {
      alert('Number of guests must be at least 1');
      return;
    }

    setLoading(true);

    try {
      let base64Files = [];
      if (formData.aadharFiles.length > 0) {
        base64Files = await Promise.all(
          formData.aadharFiles.map(
            file =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
          )
        );
      }

      const rsvpData = {
        weddingId: WEDDING_ID,
        guestName: formData.guestName,
        arrivalDate: formData.arrivalDate || null,
        departureDate: formData.departureDate || null,
        numberOfGuests: formData.numberOfGuests ? parseInt(formData.numberOfGuests) : null,
        attending: formData.attending,
        aadharImages: base64Files,
        timestamp: new Date().toISOString()
      };

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/rsvp/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        alert('Error submitting RSVP. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Error submitting RSVP.');
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
          <p>Your RSVP has been submitted for {WEDDING_NAME}.</p>
          <Heart className="w-12 h-12 text-pink-500 mx-auto animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  const isAadharRequired = formData.attending === 'yes' || formData.attending === 'maybe';
  const isGuestsRequired = isAadharRequired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Wedding Identifier */}
        <div className="bg-pink-100 border-2 border-pink-300 rounded-lg p-3 text-center mb-4">
          <p className="text-pink-800 font-semibold text-lg">{WEDDING_NAME}</p>
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">You're Invited!</h1>
          <p className="text-xl text-gray-600">Join us in celebrating our special day</p>
        </div>

        {/* RSVP Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">RSVP</h2>

          <div className="space-y-6">
            {/* Guest Name */}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests {isGuestsRequired ? <span className="text-red-500">*</span> : '(Optional)'}
              </label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={(e) => handleInputChange(e.target)}
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400"
                placeholder={isGuestsRequired ? 'How many people will attend?' : 'Optional'}
              />
            </div>

            {/* Arrival */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Arrival (Optional)
              </label>
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={(e) => handleInputChange(e.target)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400"
              />
            </div>

            {/* Departure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date of Departure (Optional)
              </label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={(e) => handleInputChange(e.target)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-400"
              />
            </div>

            {/* Attendance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Will you be attending? <span className="text-red-500">*</span>
              </label>

              <div className="space-y-3">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={formData.attending === 'yes'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                  />
                  Yes, I'll be there!
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="maybe"
                    checked={formData.attending === 'maybe'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                  />
                  Maybe, not sure yet
                </label>

                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={formData.attending === 'no'}
                    onChange={(e) => handleInputChange(e.target)}
                    className="mr-3"
                  />
                  Sorry, can't make it
                </label>
              </div>
            </div>

            {/* Aadhar Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Aadhar Documents {isAadharRequired ? <span className="text-red-500">*</span> : '(Optional)'}
              </label>

              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                multiple
                className="w-full px-4 py-3 border-2 rounded-lg"
              />

              {aadharPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {aadharPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview.preview} className="w-full h-32 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs mt-1 truncate">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mandatory Note */}
            <div className="bg-blue-50 border rounded-lg p-4 text-sm">
              <strong>Note:</strong> Fields marked with <span className="text-red-500">*</span> are mandatory.
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 rounded-lg hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-600 text-sm">
          Thank you for being part of our special day! 💕
        </div>
      </div>
    </div>
  );
}
