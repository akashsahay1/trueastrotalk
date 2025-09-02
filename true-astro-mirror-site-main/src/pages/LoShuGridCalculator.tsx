
import React, { useState } from 'react';
import { Calendar, Calculator, Star, Info, Brain, Heart, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const LoShuGridCalculator = () => {
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [digitCount, setDigitCount] = useState({1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0});
  const [lifePath, setLifePath] = useState(0);

  // Number meanings
  const numberMeanings = {
    1: {
      title: "Self & Independence",
      description: "Represents self-confidence, leadership, and individuality. A strong number 1 indicates independence and ambition.",
      traits: ["Leadership", "Innovation", "Courage"]
    },
    2: {
      title: "Relationships & Harmony",
      description: "Symbolizes partnerships, balance, and diplomacy. This number represents your ability to cooperate and maintain harmony.",
      traits: ["Cooperation", "Intuition", "Sensitivity"]
    },
    3: {
      title: "Creativity & Expression",
      description: "Associated with creativity, joy, and self-expression. This number reveals your artistic talents and communication skills.",
      traits: ["Optimism", "Social Skills", "Imagination"]
    },
    4: {
      title: "Stability & Process",
      description: "Represents stability, organization, and hard work. This number shows your practical approach to achieving goals.",
      traits: ["Discipline", "Reliability", "Patience"]
    },
    5: {
      title: "Freedom & Change",
      description: "Symbolizes freedom, adventure, and adaptability. This number indicates your desire for change and new experiences.",
      traits: ["Versatility", "Curiosity", "Resourcefulness"]
    },
    6: {
      title: "Home & Responsibility",
      description: "Associated with domestic life, responsibility, and nurturing. This number represents your caring nature.",
      traits: ["Compassion", "Responsibility", "Protectiveness"]
    },
    7: {
      title: "Wisdom & Spirituality",
      description: "Represents knowledge, introspection, and spiritual awareness. This number reveals your analytical abilities.",
      traits: ["Intuition", "Perfectionism", "Wisdom"]
    },
    8: {
      title: "Power & Abundance",
      description: "Symbolizes authority, success, and material abundance. This number shows your leadership potential.",
      traits: ["Ambition", "Efficiency", "Practicality"]
    },
    9: {
      title: "Completion & Humanity",
      description: "Associated with humanitarianism, compassion, and endings. This number represents your selfless nature.",
      traits: ["Idealism", "Tolerance", "Artistic"]
    }
  };

  // Life path meanings
  const lifePathMeanings = {
    1: "The Leader - Independent, ambitious, and driven to create new beginnings.",
    2: "The Diplomat - Cooperative, intuitive, and skilled at creating harmony.",
    3: "The Communicator - Creative, expressive, and optimistic in all endeavors.",
    4: "The Builder - Practical, disciplined, and reliable in achieving goals.",
    5: "The Adventurer - Freedom-loving, adaptable, and curious about the world.",
    6: "The Nurturer - Responsible, caring, and committed to family and community.",
    7: "The Seeker - Analytical, introspective, and drawn to wisdom and truth.",
    8: "The Achiever - Ambitious, authoritative, and skilled in material accomplishments.",
    9: "The Humanitarian - Compassionate, generous, and dedicated to serving others."
  };

  const traditionalGrid = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const gridLabels = ["Stability", "Completion", "Relationships", "Creativity", "Freedom", "Wisdom", "Power", "Self", "Home"];

  const countDigits = (dateString) => {
    const count = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
    
    // Count individual digits from the birth date
    for (let char of dateString) {
      const digit = parseInt(char);
      if (digit >= 1 && digit <= 9) {
        count[digit]++;
      }
    }
    
    return count;
  };

  const reduceToSingleDigit = (number) => {
    while (number > 9) {
      number = number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return number;
  };

  const calculateLifePath = (day, month, year) => {
    // Example: For D.O.B 15/03/1977
    // The numbers of birth date are 1, 5, 3, 1, 9, 7, 7
    // For a driver number, add day number 15 to a single digit: 1+5 = 6
    const driverNumber = reduceToSingleDigit(parseInt(day));
    
    // For a conductor number, add the full date to a single digit: 1+5+0+3+1+9+7+7 = 33 = 3+3 = 6
    const fullDateString = day + month + year;
    let conductorSum = 0;
    for (let char of fullDateString) {
      const digit = parseInt(char);
      if (!isNaN(digit)) {
        conductorSum += digit;
      }
    }
    const conductorNumber = reduceToSingleDigit(conductorSum);
    
    // Finally, the numbers are present 1, 5, 3, 1, 9, 7, 7 and 6, 6
    // The life path is typically the conductor number
    return conductorNumber;
  };

  const calculateLoShu = () => {
    if (!birthDay || !birthMonth || !birthYear) {
      alert('Please enter your complete birth date');
      return;
    }

    const dateString = birthDay + birthMonth + birthYear;
    const newDigitCount = countDigits(dateString);
    const newLifePath = calculateLifePath(birthDay, birthMonth, birthYear);

    setDigitCount(newDigitCount);
    setLifePath(newLifePath);
    setShowResult(true);
  };

  const loadExample = () => {
    setBirthDay('15');
    setBirthMonth('03');
    setBirthYear('1977');
  };

  const getGridCellStyle = (position, count) => {
    if (count >= 2) {
      return "bg-gradient-to-br from-orange-400 to-red-400 text-white";
    } else if (count === 0) {
      return "bg-gray-200 text-gray-400 opacity-60";
    }
    return "bg-gradient-to-br from-purple-500 to-blue-500 text-white";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Star className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-purple-800">Lo Shu Grid Calculator</h1>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your numerology chart based on the ancient Lo Shu Grid system
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Calculate Your Grid
            </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Enter your birth date:
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      type="number"
                      placeholder="Day"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      min="1"
                      max="31"
                      className="text-center"
                    />
                    <Input
                      type="number"
                      placeholder="Month"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      min="1"
                      max="12"
                      className="text-center"
                    />
                    <Input
                      type="number"
                      placeholder="Year"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      min="1900"
                      max="2100"
                      className="text-center"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadExample}
                    className="mt-3 text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    Load Example (15/03/1977)
                  </Button>
                  
                  {/* Formula Explanation */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">How can you calculate and use Lo Shu grid numbers?</h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>
                        The Lo Shu grid numbers are taken from date of birth. Simply, these are the individual numbers of the full birth date, single digit as a{' '}
                        <span className="text-blue-600 font-medium">driver or birthday number</span> and single numeral as conductor or life path 
                        number. If number 0 exists on the date of birth, it must be out of the calculation. If you don't want to do it manually, this numerology Loshu grid calculator can do it.
                      </p>
                      <p className="font-medium">Example: For D.O.B 15/03/1977</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>The numbers of birth date are 1, 5, 3, 1, 9, 7, 7</li>
                        <li>For a driver number, add day number 15 to a single digit: 1+5 = 6</li>
                        <li>For a conductor number, add the full date to a single digit: 1+5+0+3+1+9+7+7 = 33 = 3+3 = 6</li>
                        <li>Finally, the numbers are present 1, 5, 3, 1, 9, 7, 7 and 6, 6</li>
                      </ul>
                      <p>
                        Now place the numbers in the chart at fixed positions, which are given for each number, and disappear numerals taken as 2, 4, 8, which are not in these numbers from the range 1 to 9.
                      </p>
                    </div>
                  </div>
                </div>

              <Button
                onClick={calculateLoShu}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate My Lo Shu Grid
              </Button>
            </div>

            {/* Results */}
            {showResult && (
              <div className="mt-8 space-y-8 animate-in fade-in duration-500">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-800 mb-4">Your Personal Lo Shu Grid</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    {/* Birth Date Grid */}
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3">Your Birth Date Grid</h4>
                      <div className="grid grid-cols-3 gap-2 mx-auto w-fit">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((position) => {
                          const count = digitCount[position];
                          return (
                            <div
                              key={position}
                              className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center text-sm font-bold relative transition-all hover:scale-105 ${getGridCellStyle(position, count)}`}
                            >
                              <div className="text-lg">{position}</div>
                              {count > 0 && (
                                <div className="absolute -top-1 -right-1 bg-white text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                  {count}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Traditional Grid */}
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3">Traditional Lo Shu Grid</h4>
                      <div className="grid grid-cols-3 gap-2 mx-auto w-fit">
                        {traditionalGrid.map((number, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg flex flex-col items-center justify-center text-xs font-bold"
                          >
                            <div className="text-lg">{number}</div>
                            <div className="text-[10px] leading-tight">{gridLabels[index]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Life Path Number */}
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-orange-800 mb-2">Your Life Path Number</h3>
                  <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                    {lifePath}
                  </div>
                  <p className="text-orange-700">{lifePathMeanings?.[lifePath]}</p>
                </div>

                {/* Number Meanings */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 text-center">Number Meanings in Your Grid</h3>
                  <div className="grid gap-4">
                    {Object.entries(numberMeanings).map(([number, meaning]) => {
                      const count = digitCount[parseInt(number)];
                      return (
                        <div key={number} className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-start gap-4">
                            <div className="text-2xl font-bold text-purple-600 min-w-[2rem]">{number}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-purple-800 mb-1">{meaning.title}</h4>
                              <p className="text-gray-600 text-sm mb-2">{meaning.description}</p>
                              <div className={`text-sm font-medium flex items-center gap-1 ${
                                count === 0 ? 'text-red-600' : 
                                count >= 2 ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {count === 0 ? '❌ Not present in your chart' : 
                                 count === 1 ? '✅ Appears once' : 
                                 `✅✅ Appears ${count} times (strong influence)`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6" />
                About the Lo Shu Grid
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">Ancient Origins</h3>
                  </div>
                  <p className="text-blue-700 leading-relaxed">
                    The Lo Shu Grid is an ancient Chinese numerology chart that dates back to 650 BC. 
                    It was discovered on the back of a turtle that emerged from the Lo River.
                  </p>
                  <p className="text-blue-700 leading-relaxed mt-2">
                    This 3×3 grid contains numbers 1 to 9 arranged so that each row, column, 
                    and diagonal adds up to 15 - the number of days in each of the 24 cycles of the Chinese solar year.
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Calculator className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">How It Works</h3>
                  </div>
                  <p className="text-green-700 leading-relaxed mb-3">
                    Your birth date is analyzed to reveal which numbers appear and how many times:
                  </p>
                  <ul className="text-green-700 space-y-1 ml-4">
                    <li>• Numbers that appear multiple times represent your strengths</li>
                    <li>• Missing numbers indicate areas to develop</li>
                    <li>• The center position (number 5) represents balance and harmony</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-800">Key Personality Traits</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center bg-white rounded-lg p-4">
                      <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold text-purple-800">Mental Strength</div>
                      <div className="text-sm text-purple-600">Analytical & strategic thinking</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-4">
                      <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="font-semibold text-purple-800">Emotional Depth</div>
                      <div className="text-sm text-purple-600">Empathy & compassion</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-4">
                      <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold text-purple-800">Willpower</div>
                      <div className="text-sm text-purple-600">Determination & resilience</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-4">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold text-purple-800">Social Skills</div>
                      <div className="text-sm text-purple-600">Communication & relationships</div>
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

export default LoShuGridCalculator;
