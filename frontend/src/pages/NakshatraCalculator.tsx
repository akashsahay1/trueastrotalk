
import React from 'react';
import { Star, Calculator, Info, List, Signature, Globe, Cake, Clock, Moon, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';

const NakshatraCalculator = () => {
  const [formData, setFormData] = React.useState({
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

  const [result, setResult] = React.useState<{
    nakshatra: string;
    symbol: string;
    deity: string;
    planet: string;
    nature: string;
    traits: string;
  } | null>(null);

  const [showResult, setShowResult] = React.useState(false);

  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 
    'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
    'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
    'Uttara Bhadrapada', 'Revati'
  ];

  const nakshatraDetails = {
    'Ashwini': {
      symbol: "Horse's Head",
      deity: "Ashwini Kumaras",
      planet: "Ketu",
      nature: "Deva (Divine)",
      traits: "Energetic, quick, healer, adventurous, pioneering spirit"
    },
    'Rohini': {
      symbol: "Ox Cart",
      deity: "Brahma",
      planet: "Moon",
      nature: "Manushya (Human)",
      traits: "Creative, charming, sensual, materialistic, patient"
    },
    'Krittika': {
      symbol: "Razor",
      deity: "Agni",
      planet: "Sun",
      nature: "Rakshasa (Demonic)",
      traits: "Courageous, determined, sharp, critical, leadership skills"
    },
    'Mrigashira': {
      symbol: "Deer's Head",
      deity: "Soma",
      planet: "Mars",
      nature: "Deva (Divine)",
      traits: "Curious, restless, creative, sensual, searching nature"
    },
    'Punarvasu': {
      symbol: "Quiver of Arrows",
      deity: "Aditi",
      planet: "Jupiter",
      nature: "Deva (Divine)",
      traits: "Nurturing, adaptable, resourceful, spiritual, optimistic"
    }
  } as const;

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

  const calculateNakshatra = () => {
    // Simplified calculation based on month and day
    const index = (parseInt(formData.month) * 2 + parseInt(formData.day) % 27) % 27;
    const nakshatra = nakshatras[index];
    const details = nakshatraDetails[nakshatra as keyof typeof nakshatraDetails] || nakshatraDetails['Rohini'];
    
    return {
      nakshatra,
      ...details
    };
  };

  const handleCalculate = () => {
    if (validateForm()) {
      const calculatedResult = calculateNakshatra();
      setResult(calculatedResult);
      setShowResult(true);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-900/90 to-purple-900/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl text-yellow-300">
                  <Star className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Nakshatra Birth Star Calculator</h1>
                  <p className="text-xl opacity-90">Discover your Vedic birth star and unlock your cosmic destiny</p>
                </div>
              </div>
            </div>
            
            {/* Animated stars background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Calculator Section */}
            <div className="flex-1 p-8">
              <h2 className="text-3xl font-bold text-yellow-300 border-b-2 border-gray-700 pb-4 mb-8 flex items-center">
                <Calculator className="w-8 h-8 mr-3" />
                Calculate Your Nakshatra
              </h2>
              <p className="text-gray-300 mb-8">Enter your birth details to discover your Vedic birth star and its significance</p>
              
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-white font-medium mb-2 flex items-center">
                    <Signature className="w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-red-400 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Gender and Birth Place */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Place of Birth *
                    </label>
                    <GooglePlacesAutocomplete
                      value={formData.birthPlace}
                      onChange={(value) => handleInputChange('birthPlace', value)}
                      placeholder="Enter your birth place"
                      className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-red-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-white font-medium mb-2 flex items-center">
                    <Cake className="w-4 h-4 mr-2" />
                    Date of Birth *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <select
                      value={formData.day}
                      onChange={(e) => handleInputChange('day', e.target.value)}
                      className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
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
                      className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
                      required
                    >
                      <option value="">Select Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
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
                  <label className="block text-white font-medium mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Time of Birth *
                  </label>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="unknown-time"
                      checked={formData.unknownTime}
                      onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
                      className="mr-3 h-4 w-4 text-red-400"
                    />
                    <label htmlFor="unknown-time" className="text-white">
                      I don't know my time of birth
                    </label>
                  </div>
                  
                  {!formData.unknownTime && (
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={formData.hour}
                        onChange={(e) => handleInputChange('hour', e.target.value)}
                        className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select Hour</option>
                        {generateTimeOptions(24).map(hour => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                      <select
                        value={formData.minute}
                        onChange={(e) => handleInputChange('minute', e.target.value)}
                        className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select Minute</option>
                        {generateTimeOptions(60).map(minute => (
                          <option key={minute} value={minute}>{minute}</option>
                        ))}
                      </select>
                      <select
                        value={formData.second}
                        onChange={(e) => handleInputChange('second', e.target.value)}
                        className="p-4 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:border-red-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select Second</option>
                        {generateTimeOptions(60).map(second => (
                          <option key={second} value={second}>{second}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-400 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-red-600 hover:to-orange-500 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Calculate My Nakshatra
                </button>

                {/* Result Section */}
                {showResult && result && (
                  <div className="mt-8 bg-gradient-to-br from-indigo-800/50 to-purple-800/50 rounded-xl p-8 border border-white/10">
                    <div className="text-center mb-6">
                      <div className="text-6xl text-yellow-300 mb-4">
                        <Star className="w-16 h-16 mx-auto" />
                      </div>
                      <div className="text-4xl font-bold text-yellow-300 mb-2">{result.nakshatra}</div>
                      <p className="text-white">Your Vedic Birth Star</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/10 rounded-lg p-4 border-l-4 border-purple-400">
                        <div className="text-red-400 font-semibold mb-2">Symbol</div>
                        <div className="text-white text-lg">{result.symbol}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4 border-l-4 border-purple-400">
                        <div className="text-red-400 font-semibold mb-2">Deity</div>
                        <div className="text-white text-lg">{result.deity}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4 border-l-4 border-purple-400">
                        <div className="text-red-400 font-semibold mb-2">Ruling Planet</div>
                        <div className="text-white text-lg">{result.planet}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4 border-l-4 border-purple-400">
                        <div className="text-red-400 font-semibold mb-2">Nature</div>
                        <div className="text-white text-lg">{result.nature}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 border-l-4 border-purple-400">
                      <div className="text-red-400 font-semibold mb-2">Personality Traits</div>
                      <div className="text-white text-lg">{result.traits}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Info Section */}
            <div className="flex-1 p-8 bg-gradient-to-br from-purple-900/30 to-indigo-900/30">
              <h2 className="text-3xl font-bold text-yellow-300 border-b-2 border-gray-700 pb-4 mb-8 flex items-center">
                <Info className="w-8 h-8 mr-3" />
                About Nakshatras
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                    <Moon className="w-5 h-5 mr-2" />
                    What is a Nakshatra?
                  </h3>
                  <p className="text-gray-300 mb-4">
                    In Vedic astrology, Nakshatras are the 27 lunar mansions that the moon travels through during its monthly cycle. Each Nakshatra spans 13°20' of the zodiac and has its own unique characteristics, deity, and planetary ruler.
                  </p>
                  <p className="text-gray-300">
                    Your birth Nakshatra (or Janma Nakshatra) is the constellation where the moon was positioned at the time of your birth. It reveals your deepest instincts, emotional patterns, and karmic tendencies.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Significance
                  </h3>
                  <p className="text-gray-300 mb-4">Knowing your Nakshatra helps you understand:</p>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Your inherent strengths and weaknesses</li>
                    <li>• Career paths that align with your nature</li>
                    <li>• Relationship compatibility with others</li>
                    <li>• Favorable times for important activities</li>
                    <li>• Your spiritual purpose and life lessons</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                    <List className="w-5 h-5 mr-2" />
                    27 Nakshatras
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {nakshatras.slice(0, 9).map((nakshatra, index) => (
                      <div key={index} className="bg-purple-700/30 rounded-lg p-3 text-center hover:bg-purple-700/50 transition-colors cursor-pointer border border-white/10">
                        <div className="text-yellow-300 mb-1">
                          <Star className="w-4 h-4 mx-auto" />
                        </div>
                        <div className="text-white text-sm">{nakshatra}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 text-6xl text-white/10 font-serif">"</div>
                  <p className="text-white italic mb-4 relative z-10">
                    "Discovering my Nakshatra gave me profound insights into my personality and life path. The guidance I received was incredibly accurate and helpful!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full flex items-center justify-center text-purple-900 font-bold text-lg mr-4">
                      P
                    </div>
                    <div>
                      <h4 className="text-yellow-300 font-bold">Priya Sharma</h4>
                      <p className="text-white/80">Mumbai, India</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NakshatraCalculator;
