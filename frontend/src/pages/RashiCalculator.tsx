
import React, { useState } from 'react';
import { Calendar, User, MapPin, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';

const RashiCalculator = () => {
  const [currentPage, setCurrentPage] = useState('form');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    day: '',
    month: '',
    year: '',
    hour: '',
    minute: '',
    second: '',
    birthPlace: '',
    unknownTime: false
  });
  const [calculatedRashi, setCalculatedRashi] = useState('');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const rashis = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName) {
      alert('Please enter your full name');
      return false;
    }
    
    if (!formData.gender) {
      alert('Please select your gender');
      return false;
    }
    
    if (!formData.day || !formData.month || !formData.year) {
      alert('Please select your complete date of birth');
      return false;
    }
    
    if (!formData.unknownTime) {
      if (!formData.hour || !formData.minute || !formData.second) {
        alert('Please select your complete time of birth');
        return false;
      }
    }
    
    if (!formData.birthPlace) {
      alert('Please enter your place of birth');
      return false;
    }
    
    return true;
  };

  const calculateRashi = () => {
    // Simplified calculation for demonstration
    // In a real application, this would involve complex astronomical calculations
    return rashis[parseInt(formData.month)];
  };

  const handleCalculate = () => {
    if (validateForm()) {
      const rashi = calculateRashi();
      setCalculatedRashi(rashi);
      setCurrentPage('result');
    }
  };

  const handleRecalculate = () => {
    setFormData({
      fullName: '',
      gender: '',
      day: '',
      month: '',
      year: '',
      hour: '',
      minute: '',
      second: '',
      birthPlace: '',
      unknownTime: false
    });
    setCurrentPage('form');
  };

  const generateDays = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  };

  const generateTimeOptions = (max: number) => {
    return Array.from({ length: max }, (_, i) => i.toString().padStart(2, '0'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Rashi Calculator</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Enter your birth details to calculate your rising sign (ascendant)
            </p>
          </div>

          {/* Form Page */}
          {currentPage === 'form' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-pink-500 border-b-2 border-gray-200 pb-4 mb-8">
                Personal Information
              </h2>
              
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Date of Birth *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      value={formData.day}
                      onChange={(e) => handleInputChange('day', e.target.value)}
                      className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Select Day</option>
                      {generateDays().map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={formData.month}
                      onChange={(e) => handleInputChange('month', e.target.value)}
                      className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Select Month</option>
                      {monthNames.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Select Year</option>
                      {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Time of Birth *
                  </label>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="unknown-time"
                      checked={formData.unknownTime}
                      onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
                      className="mr-3 h-4 w-4 text-pink-500"
                    />
                    <label htmlFor="unknown-time" className="text-sm text-gray-700">
                      I don't know my time of birth
                    </label>
                  </div>
                  
                  {!formData.unknownTime && (
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={formData.hour}
                        onChange={(e) => handleInputChange('hour', e.target.value)}
                        className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select Hour</option>
                        {generateTimeOptions(24).map(hour => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                      <select
                        value={formData.minute}
                        onChange={(e) => handleInputChange('minute', e.target.value)}
                        className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select Minute</option>
                        {generateTimeOptions(60).map(minute => (
                          <option key={minute} value={minute}>{minute}</option>
                        ))}
                      </select>
                      <select
                        value={formData.second}
                        onChange={(e) => handleInputChange('second', e.target.value)}
                        className="p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select Second</option>
                        {generateTimeOptions(60).map(second => (
                          <option key={second} value={second}>{second}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Place of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Place of Birth *
                  </label>
                  <GooglePlacesAutocomplete
                    value={formData.birthPlace}
                    onChange={(value) => handleInputChange('birthPlace', value)}
                    placeholder="Enter your birth place"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-orange-500 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Calculate my Rashi
                </button>
              </div>
            </div>
          )}

          {/* Result Page */}
          {currentPage === 'result' && (
            <div className="p-8">
              {/* Result Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-8 rounded-xl text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">YOUR RASHI</h2>
                <div className="text-5xl font-extrabold text-yellow-300 drop-shadow-lg">
                  {calculatedRashi}
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-gray-50 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-pink-500 mb-6">Personal Details</h3>
                <div className="space-y-4">
                  <div className="flex py-3 border-b border-gray-200">
                    <div className="font-semibold w-32 text-gray-600">Name</div>
                    <div className="flex-1 font-medium">{formData.fullName}</div>
                  </div>
                  <div className="flex py-3 border-b border-gray-200">
                    <div className="font-semibold w-32 text-gray-600">Gender</div>
                    <div className="flex-1 font-medium capitalize">{formData.gender}</div>
                  </div>
                  <div className="flex py-3 border-b border-gray-200">
                    <div className="font-semibold w-32 text-gray-600">Date of Birth</div>
                    <div className="flex-1 font-medium">
                      {formData.day} {monthNames[parseInt(formData.month)]} {formData.year}
                    </div>
                  </div>
                  <div className="flex py-3 border-b border-gray-200">
                    <div className="font-semibold w-32 text-gray-600">Place of Birth</div>
                    <div className="flex-1 font-medium">{formData.birthPlace}</div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-blue-700 mb-4">What is Your Rising Sign?</h3>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Your rising sign (also called your ascendant) is the zodiac sign that was rising on the eastern horizon at the exact moment you were born. While your sun sign represents your core identity, your rising sign influences how others perceive you and your first impressions.
                  </p>
                  <p>
                    People with {calculatedRashi} rising tend to project specific qualities that make a lasting impression. Your rising sign affects your appearance, behavior, and the energy you bring into any room.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRecalculate}
                className="w-full bg-gray-200 text-gray-700 py-4 px-8 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors duration-300"
              >
                Calculate another Rashi
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center p-6 border-t border-gray-200 text-gray-500 text-sm">
            <p>Rashi Calculator © 2024 | Discover Your True Self Through Astrology</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RashiCalculator;
