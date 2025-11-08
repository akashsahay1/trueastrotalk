import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, User, Users, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

interface PersonDetails {
  name: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  second: number;
  birthplace: string;
}

interface AshtakootResult {
  attribute: string;
  male: string;
  female: string;
  received: number;
  outOf: number;
  areaOfLife: string;
  description: string;
  meaning: string;
}

const KundaliMatching = () => {
  const [boyDetails, setBoyDetails] = React.useState<PersonDetails>({
    name: '',
    day: 1,
    month: 1,
    year: 1990,
    hour: 1,
    minute: 0,
    second: 0,
    birthplace: 'New Delhi, Delhi, India'
  });

  const [girlDetails, setGirlDetails] = React.useState<PersonDetails>({
    name: '',
    day: 1,
    month: 1,
    year: 1992,
    hour: 1,
    minute: 0,
    second: 0,
    birthplace: 'New Delhi, Delhi, India'
  });

  const [showReport, setShowReport] = React.useState(false);
  const [matchingResult, setMatchingResult] = React.useState<AshtakootResult[]>([]);
  const [totalPoints, setTotalPoints] = React.useState(0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const cities = [
    'New Delhi, Delhi, India', 'Mumbai, Maharashtra, India', 'Bangalore, Karnataka, India',
    'Chennai, Tamil Nadu, India', 'Kolkata, West Bengal, India', 'Hyderabad, Telangana, India',
    'Pune, Maharashtra, India', 'Ahmedabad, Gujarat, India', 'Jaipur, Rajasthan, India',
    'Lucknow, Uttar Pradesh, India', 'Kanpur, Uttar Pradesh, India', 'Nagpur, Maharashtra, India'
  ];

  const updateBoyDetail = (field: keyof PersonDetails, value: string | number) => {
    setBoyDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateGirlDetail = (field: keyof PersonDetails, value: string | number) => {
    setGirlDetails(prev => ({ ...prev, [field]: value }));
  };

  const incrementValue = (person: 'boy' | 'girl', field: keyof PersonDetails, min: number, max: number) => {
    const current = person === 'boy' ? boyDetails[field] as number : girlDetails[field] as number;
    if (current < max) {
      if (person === 'boy') {
        updateBoyDetail(field, current + 1);
      } else {
        updateGirlDetail(field, current + 1);
      }
    }
  };

  const decrementValue = (person: 'boy' | 'girl', field: keyof PersonDetails, min: number, max: number) => {
    const current = person === 'boy' ? boyDetails[field] as number : girlDetails[field] as number;
    if (current > min) {
      if (person === 'boy') {
        updateBoyDetail(field, current - 1);
      } else {
        updateGirlDetail(field, current - 1);
      }
    }
  };

  const calculateMatching = () => {
    // Sample calculation logic
    const results: AshtakootResult[] = [
      {
        attribute: 'Varna',
        male: 'Brahmin',
        female: 'Kshatriya',
        received: 1,
        outOf: 1,
        areaOfLife: 'Natural Refinement',
        description: 'Excellent understanding of work-related feelings',
        meaning: 'Mental compatibility indicator'
      },
      {
        attribute: 'Vashya',
        male: 'Manav',
        female: 'Vanchar',
        received: 1.5,
        outOf: 2,
        areaOfLife: 'Mutual Attraction',
        description: 'Good emotional and professional understanding',
        meaning: 'Tendency to influence each other'
      },
      {
        attribute: 'Tara',
        male: 'Janma',
        female: 'Sampat',
        received: 2,
        outOf: 3,
        areaOfLife: 'Prosperity & Health',
        description: 'Emotional inclination ensures relationship longevity',
        meaning: 'Fortune indicator'
      },
      {
        attribute: 'Yoni',
        male: 'Ashwa',
        female: 'Gaja',
        received: 2.5,
        outOf: 4,
        areaOfLife: 'Physical Intimacy',
        description: 'Harmonious bonding over time',
        meaning: 'Sexual compatibility indicator'
      },
      {
        attribute: 'Maitri',
        male: 'Saturn',
        female: 'Saturn',
        received: 5,
        outOf: 5,
        areaOfLife: 'Friendship',
        description: 'Best planetary combination possible',
        meaning: 'Mental connection indicator'
      },
      {
        attribute: 'Gan',
        male: 'Deva',
        female: 'Rakshasa',
        received: 3,
        outOf: 6,
        areaOfLife: 'Temperament',
        description: 'Need careful consideration in all aspects',
        meaning: 'Behavior compatibility'
      },
      {
        attribute: 'Bhakoot',
        male: 'Aquarius',
        female: 'Capricorn',
        received: 0,
        outOf: 7,
        areaOfLife: 'Health & Wealth',
        description: 'Inauspicious combination, consult astrologer',
        meaning: 'Wealth and health assessment'
      },
      {
        attribute: 'Nadi',
        male: 'Madhya',
        female: 'Adhya',
        received: 8,
        outOf: 8,
        areaOfLife: 'Progeny',
        description: 'Beneficial and long-lasting partnership',
        meaning: 'Health and progeny compatibility'
      }
    ];

    const total = results.reduce((sum, result) => sum + result.received, 0);
    setMatchingResult(results);
    setTotalPoints(total);
    setShowReport(true);
  };

  const getCompatibilityText = (points: number) => {
    if (points >= 28) return { text: 'Excellent Compatibility - Highly recommended', color: 'text-green-600' };
    if (points >= 24) return { text: 'Good Compatibility - Marriage approved', color: 'text-blue-600' };
    if (points >= 18) return { text: 'Medium Compatibility - Marriage can be approved with precautions', color: 'text-yellow-600' };
    return { text: 'Low Compatibility - Not recommended without remedies', color: 'text-red-600' };
  };

  const compatibility = getCompatibilityText(totalPoints);

  if (showReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Kundali Matching Report</h1>
                <p className="text-xl opacity-90">Detailed analysis based on Vedic astrology principles</p>
              </div>

              <div className="p-8">
                {/* Partner Details */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                      <User className="w-6 h-6 mr-2" />
                      Boy's Details
                    </h3>
                    <div className="space-y-3">
                      <p><strong>Name:</strong> {boyDetails.name || 'Rahul Sharma'}</p>
                      <p><strong>Birth Date & Time:</strong> {boyDetails.day} {months[boyDetails.month - 1]} {boyDetails.year} | {boyDetails.hour}:{boyDetails.minute.toString().padStart(2, '0')}:{boyDetails.second.toString().padStart(2, '0')}</p>
                      <p><strong>Birth Place:</strong> {boyDetails.birthplace}</p>
                      <p><strong>Janam Rashi:</strong> Aquarius</p>
                    </div>
                  </div>

                  <div className="bg-pink-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-pink-800 mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-2" />
                      Girl's Details
                    </h3>
                    <div className="space-y-3">
                      <p><strong>Name:</strong> {girlDetails.name || 'Priya Patel'}</p>
                      <p><strong>Birth Date & Time:</strong> {girlDetails.day} {months[girlDetails.month - 1]} {girlDetails.year} | {girlDetails.hour}:{girlDetails.minute.toString().padStart(2, '0')}:{girlDetails.second.toString().padStart(2, '0')}</p>
                      <p><strong>Birth Place:</strong> {girlDetails.birthplace}</p>
                      <p><strong>Janam Rashi:</strong> Capricorn</p>
                    </div>
                  </div>
                </div>

                {/* Ashtakoot Table */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Match Ashtakoot Points</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                      <thead className="bg-purple-600 text-white">
                        <tr>
                          <th className="p-3 text-left">Attribute</th>
                          <th className="p-3 text-left">Male</th>
                          <th className="p-3 text-left">Female</th>
                          <th className="p-3 text-center">Received</th>
                          <th className="p-3 text-center">Out of</th>
                          <th className="p-3 text-left">Area Of Life</th>
                          <th className="p-3 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchingResult.map((result, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-3 font-medium">{result.attribute}</td>
                            <td className="p-3">{result.male}</td>
                            <td className="p-3">{result.female}</td>
                            <td className="p-3 text-center font-bold">{result.received}</td>
                            <td className="p-3 text-center">{result.outOf}</td>
                            <td className="p-3">{result.areaOfLife}</td>
                            <td className="p-3 text-sm">{result.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Points */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-8 text-center mb-8">
                  <h3 className="text-2xl font-bold text-blue-800 mb-4">Total Ashtakoot Points</h3>
                  <div className="text-6xl font-bold text-green-600 mb-4">{totalPoints}/36</div>
                  <p className={`text-xl font-semibold mb-4 ${compatibility.color}`}>{compatibility.text}</p>
                  <p className="text-gray-700">According to Vedic astrology principles, this match has {totalPoints >= 18 ? 'good' : 'limited'} potential for a harmonious marriage.</p>
                </div>

                {/* Dosha Analysis */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-bold text-red-800 mb-4">Dosha Analysis</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Manglik Match:</strong> Both partners are not Manglik, which is favorable for marriage.</p>
                    <p><strong>Nadi Dosha:</strong> Present - This may affect health and progeny. Remedies are available.</p>
                    <p><strong>Bhakoot Dosha:</strong> Present - This may affect financial stability and health. Requires astrological remedies.</p>
                    <p><strong>Overall:</strong> The match has some doshas that can be mitigated through proper remedies. Marriage is possible after consulting an astrologer.</p>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => setShowReport(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Matching Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Kundli Milan & Gun Milan</h1>
            <p className="text-xl opacity-90 mb-6">Free Horoscope Matching to Check Marriage Compatibility</p>
            <div className="flex justify-center gap-8 text-3xl">
              <span>♈</span><span>♉</span><span>♊</span><span>♋</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 text-center">
              <h2 className="text-2xl font-bold">Fill Up Partner's Details for Horoscope Matching</h2>
            </div>

            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Boy's Details */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-2" />
                    Boy's Details
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={boyDetails.name}
                        onChange={(e) => updateBoyDetail('name', e.target.value)}
                        placeholder="Enter boy's name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Details</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Day</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('boy', 'day', 1, 31)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={boyDetails.day}
                              onChange={(e) => updateBoyDetail('day', parseInt(e.target.value) || 1)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={1}
                              max={31}
                            />
                            <button
                              onClick={() => incrementValue('boy', 'day', 1, 31)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Month</label>
                          <select
                            value={boyDetails.month}
                            onChange={(e) => updateBoyDetail('month', parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            {months.map((month, index) => (
                              <option key={index} value={index + 1}>{month}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Year</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('boy', 'year', 1900, 2100)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={boyDetails.year}
                              onChange={(e) => updateBoyDetail('year', parseInt(e.target.value) || 1990)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={1900}
                              max={2100}
                            />
                            <button
                              onClick={() => incrementValue('boy', 'year', 1900, 2100)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Time</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Hour</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('boy', 'hour', 0, 23)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={boyDetails.hour}
                              onChange={(e) => updateBoyDetail('hour', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={23}
                            />
                            <button
                              onClick={() => incrementValue('boy', 'hour', 0, 23)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minute</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('boy', 'minute', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={boyDetails.minute}
                              onChange={(e) => updateBoyDetail('minute', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={59}
                            />
                            <button
                              onClick={() => incrementValue('boy', 'minute', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Second</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('boy', 'second', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={boyDetails.second}
                              onChange={(e) => updateBoyDetail('second', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={59}
                            />
                            <button
                              onClick={() => incrementValue('boy', 'second', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
                      <input
                        type="text"
                        value={boyDetails.birthplace}
                        onChange={(e) => updateBoyDetail('birthplace', e.target.value)}
                        placeholder="Search for city or district"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        list="cities"
                      />
                    </div>
                  </div>
                </div>

                {/* Girl's Details */}
                <div className="bg-pink-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-pink-800 mb-6 flex items-center">
                    <Users className="w-6 h-6 mr-2" />
                    Girl's Details
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={girlDetails.name}
                        onChange={(e) => updateGirlDetail('name', e.target.value)}
                        placeholder="Enter girl's name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Details</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Day</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('girl', 'day', 1, 31)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={girlDetails.day}
                              onChange={(e) => updateGirlDetail('day', parseInt(e.target.value) || 1)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={1}
                              max={31}
                            />
                            <button
                              onClick={() => incrementValue('girl', 'day', 1, 31)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Month</label>
                          <select
                            value={girlDetails.month}
                            onChange={(e) => updateGirlDetail('month', parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            {months.map((month, index) => (
                              <option key={index} value={index + 1}>{month}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Year</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('girl', 'year', 1900, 2100)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={girlDetails.year}
                              onChange={(e) => updateGirlDetail('year', parseInt(e.target.value) || 1992)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={1900}
                              max={2100}
                            />
                            <button
                              onClick={() => incrementValue('girl', 'year', 1900, 2100)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Time</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Hour</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('girl', 'hour', 0, 23)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={girlDetails.hour}
                              onChange={(e) => updateGirlDetail('hour', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={23}
                            />
                            <button
                              onClick={() => incrementValue('girl', 'hour', 0, 23)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minute</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('girl', 'minute', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={girlDetails.minute}
                              onChange={(e) => updateGirlDetail('minute', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={59}
                            />
                            <button
                              onClick={() => incrementValue('girl', 'minute', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Second</label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => decrementValue('girl', 'second', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={girlDetails.second}
                              onChange={(e) => updateGirlDetail('second', parseInt(e.target.value) || 0)}
                              className="flex-1 text-center border-none focus:ring-0"
                              min={0}
                              max={59}
                            />
                            <button
                              onClick={() => incrementValue('girl', 'second', 0, 59)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
                      <input
                        type="text"
                        value={girlDetails.birthplace}
                        onChange={(e) => updateGirlDetail('birthplace', e.target.value)}
                        placeholder="Search for city or district"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        list="cities"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button
                  onClick={calculateMatching}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-4 text-lg font-semibold rounded-full shadow-lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Match Horoscope
                  <Star className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
            <h4 className="text-xl font-bold text-purple-800 mb-4">About Kundli Milan (Horoscope Matching)</h4>
            <p className="text-gray-700 mb-4">
              Kundli Milan is an ancient Vedic astrology practice to check compatibility between prospective partners before marriage. 
              This sacred tradition has been followed for thousands of years in Indian culture.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-bold text-purple-700">8 Kootas (Aspects)</h5>
                <p className="text-sm text-gray-600">Matched for compatibility: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-bold text-purple-700">36 Gunas (Points)</h5>
                <p className="text-sm text-gray-600">Evaluated for marriage harmony with each Koota contributing a certain number of points</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-bold text-purple-700">Minimum 18 Gunas</h5>
                <p className="text-sm text-gray-600">Must match for an approved marriage according to Vedic principles</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h5 className="font-bold text-purple-700">Complete Analysis</h5>
                <p className="text-sm text-gray-600">Evaluates mental, physical, emotional and spiritual compatibility</p>
              </div>
            </div>
          </div>

          <datalist id="cities">
            {cities.map((city, index) => (
              <option key={index} value={city} />
            ))}
          </datalist>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KundaliMatching;
