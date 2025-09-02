
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Star, User, Info } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NumerologyCalculator = () => {
  const [name, setName] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [calculations, setCalculations] = useState({
    destiny: { number: 0, total: 0, letters: [] as Array<{letter: string, value: number}> },
    soul: { number: 0, total: 0, letters: [] as Array<{letter: string, value: number}> },
    personality: { number: 0, total: 0, letters: [] as Array<{letter: string, value: number}> }
  });

  // Chaldean numerology system mapping
  const chaldeanMap: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 8, 'G': 3, 'H': 5,
    'I': 1, 'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 7, 'P': 8,
    'Q': 1, 'R': 2, 'S': 3, 'T': 4, 'U': 6, 'V': 6, 'W': 6, 'X': 5,
    'Y': 1, 'Z': 7
  };

  const vowels = ['A', 'E', 'I', 'O', 'U'];

  const numberMeanings = {
    destiny: {
      1: { description: "The leader with strong individuality and creativity.", planet: "Ruled by Sun" },
      2: { description: "The diplomat with sensitivity and cooperation.", planet: "Ruled by Moon" },
      3: { description: "The communicator with self-expression and joy.", planet: "Ruled by Jupiter" },
      4: { description: "The builder with practicality and discipline.", planet: "Ruled by Uranus" },
      5: { description: "The freedom lover with adaptability and change.", planet: "Ruled by Mercury" },
      6: { description: "The nurturer with responsibility and harmony.", planet: "Ruled by Venus" },
      7: { description: "The seeker with wisdom and spirituality.", planet: "Ruled by Neptune" },
      8: { description: "The achiever with authority and material success.", planet: "Ruled by Saturn" },
      9: { description: "The humanitarian with compassion and idealism.", planet: "Ruled by Mars" }
    },
    soul: {
      1: { description: "Desire for independence and leadership.", planet: "Ruled by Sun" },
      2: { description: "Desire for partnership and harmony.", planet: "Ruled by Moon" },
      3: { description: "Desire for creative self-expression.", planet: "Ruled by Jupiter" },
      4: { description: "Desire for stability and security.", planet: "Ruled by Uranus" },
      5: { description: "Desire for freedom and variety.", planet: "Ruled by Mercury" },
      6: { description: "Desire to nurture and serve.", planet: "Ruled by Venus" },
      7: { description: "Desire for knowledge and wisdom.", planet: "Ruled by Neptune" },
      8: { description: "Desire for authority and success.", planet: "Ruled by Saturn" },
      9: { description: "Desire to help humanity.", planet: "Ruled by Mars" }
    },
    personality: {
      1: { description: "Appears independent and ambitious.", planet: "Ruled by Sun" },
      2: { description: "Appears cooperative and diplomatic.", planet: "Ruled by Moon" },
      3: { description: "Appears expressive and optimistic.", planet: "Ruled by Jupiter" },
      4: { description: "Appears practical and organized.", planet: "Ruled by Uranus" },
      5: { description: "Appears adventurous and adaptable.", planet: "Ruled by Mercury" },
      6: { description: "Appears responsible and caring.", planet: "Ruled by Venus" },
      7: { description: "Appears analytical and spiritual.", planet: "Ruled by Neptune" },
      8: { description: "Appears authoritative and confident.", planet: "Ruled by Saturn" },
      9: { description: "Appears compassionate and idealistic.", planet: "Ruled by Mars" }
    }
  };

  const reduceToSingleDigit = (number: number): number => {
    while (number > 9) {
      const digits = number.toString().split('');
      number = digits.reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return number;
  };

  const getCalculationSteps = (total: number, finalNumber: number): string => {
    if (total === finalNumber) {
      return `Total: ${total}`;
    }
    
    let steps = `${total}`;
    let current = total;
    
    while (current > 9) {
      const digits = current.toString().split('');
      steps += ` → ${digits.join(' + ')} = `;
      current = digits.reduce((sum, digit) => sum + parseInt(digit), 0);
      steps += current;
    }
    
    return steps;
  };

  const calculateNumerology = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    const cleanedName = name.replace(/[^A-Za-z]/g, '').toUpperCase();
    
    if (!cleanedName) {
      alert('Please enter a valid name with letters');
      return;
    }

    let destinyTotal = 0;
    let soulTotal = 0;
    let personalityTotal = 0;
    
    const destinyLetters: Array<{letter: string, value: number}> = [];
    const soulLetters: Array<{letter: string, value: number}> = [];
    const personalityLetters: Array<{letter: string, value: number}> = [];

    for (let i = 0; i < cleanedName.length; i++) {
      const letter = cleanedName[i];
      const value = chaldeanMap[letter] || 0;
      
      destinyTotal += value;
      destinyLetters.push({ letter, value });
      
      if (vowels.includes(letter)) {
        soulTotal += value;
        soulLetters.push({ letter, value });
      } else {
        personalityTotal += value;
        personalityLetters.push({ letter, value });
      }
    }

    const destinyNumber = reduceToSingleDigit(destinyTotal);
    const soulNumber = reduceToSingleDigit(soulTotal);
    const personalityNumber = reduceToSingleDigit(personalityTotal);

    setCalculations({
      destiny: { number: destinyNumber, total: destinyTotal, letters: destinyLetters },
      soul: { number: soulNumber, total: soulTotal, letters: soulLetters },
      personality: { number: personalityNumber, total: personalityTotal, letters: personalityLetters }
    });

    setShowResult(true);
  };

  const loadExample = () => {
    const examples = ["Emma Watson", "Tom Hanks", "Natalie Portman", "Chris Evans"];
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setName(randomExample);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-slate-800/95 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-16 px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
                <Star className="w-10 h-10" />
                Advanced Name Numerology Calculator
              </h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Discover your Destiny, Soul Urge, and Personality numbers based on Chaldean numerology
              </p>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Calculator Section */}
              <div className="flex-1 p-8 lg:p-12 bg-slate-800/70">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <Label className="text-blue-400 text-lg font-semibold flex items-center gap-2 mb-3">
                      <User className="w-5 h-5" />
                      Enter your full name:
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Type your name here..."
                      className="bg-slate-900/50 border-blue-500 text-white placeholder-slate-400 text-lg p-4"
                      onKeyPress={(e) => e.key === 'Enter' && calculateNumerology()}
                    />
                    <button
                      onClick={loadExample}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Load Example
                    </button>
                  </div>
                  
                  <Button 
                    onClick={calculateNumerology}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate Numerology Numbers
                  </Button>

                  {showResult && (
                    <div className="mt-8 space-y-6 animate-fade-in">
                      <h3 className="text-2xl font-bold text-blue-400 text-center">Your Numerology Numbers</h3>
                      
                      {/* Results Grid */}
                      <div className="space-y-6">
                        {/* Destiny Number */}
                        <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-600">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                              {calculations.destiny.number}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-orange-300">Destiny/Expression Number</h4>
                              <p className="text-sm text-slate-300">
                                {numberMeanings.destiny[calculations.destiny.number as keyof typeof numberMeanings.destiny]?.description}
                              </p>
                              <p className="text-xs text-blue-400 italic mt-1">
                                {numberMeanings.destiny[calculations.destiny.number as keyof typeof numberMeanings.destiny]?.planet}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Soul Urge Number */}
                        <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-600">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                              {calculations.soul.number}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-orange-300">Soul Urge Number</h4>
                              <p className="text-sm text-slate-300">
                                {numberMeanings.soul[calculations.soul.number as keyof typeof numberMeanings.soul]?.description}
                              </p>
                              <p className="text-xs text-blue-400 italic mt-1">
                                {numberMeanings.soul[calculations.soul.number as keyof typeof numberMeanings.soul]?.planet}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Personality Number */}
                        <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-600">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                              {calculations.personality.number}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-orange-300">Personality Number</h4>
                              <p className="text-sm text-slate-300">
                                {numberMeanings.personality[calculations.personality.number as keyof typeof numberMeanings.personality]?.description}
                              </p>
                              <p className="text-xs text-blue-400 italic mt-1">
                                {numberMeanings.personality[calculations.personality.number as keyof typeof numberMeanings.personality]?.planet}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Breakdown */}
                      <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-600">
                        <h4 className="text-lg font-semibold text-blue-400 mb-4 text-center">Calculation Breakdown</h4>
                        
                        <div className="space-y-6">
                          {/* Destiny Calculation */}
                          <div>
                            <h5 className="text-orange-300 font-medium mb-2">Destiny/Expression Number (All Letters)</h5>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {calculations.destiny.letters.map((item, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 text-center min-w-[50px]">
                                  <div className="text-white font-bold">{item.letter}</div>
                                  <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mx-auto mt-1">
                                    {item.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-center text-orange-300 font-medium">
                              {getCalculationSteps(calculations.destiny.total, calculations.destiny.number)}
                            </p>
                          </div>

                          {/* Soul Calculation */}
                          <div>
                            <h5 className="text-orange-300 font-medium mb-2">Soul Urge Number (Vowels Only)</h5>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {calculations.soul.letters.map((item, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 text-center min-w-[50px]">
                                  <div className="text-white font-bold">{item.letter}</div>
                                  <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mx-auto mt-1">
                                    {item.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-center text-orange-300 font-medium">
                              {getCalculationSteps(calculations.soul.total, calculations.soul.number)}
                            </p>
                          </div>

                          {/* Personality Calculation */}
                          <div>
                            <h5 className="text-orange-300 font-medium mb-2">Personality Number (Consonants Only)</h5>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {calculations.personality.letters.map((item, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 text-center min-w-[50px]">
                                  <div className="text-white font-bold">{item.letter}</div>
                                  <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mx-auto mt-1">
                                    {item.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-center text-orange-300 font-medium">
                              {getCalculationSteps(calculations.personality.total, calculations.personality.number)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 p-8 lg:p-12 bg-slate-900/60">
                <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  Chaldean Numerology System
                </h2>
                
                <div className="bg-slate-800/60 rounded-xl p-6 mb-6 border border-slate-600">
                  <div className="flex items-center gap-3 mb-4">
                    <Calculator className="w-8 h-8 text-blue-400" />
                    <h3 className="text-xl font-semibold text-orange-300">Chaldean Numerology Values</h3>
                  </div>
                  <p className="text-slate-300 mb-4">
                    This ancient system assigns numeric values to letters based on the Chaldean numerology system. 
                    Each letter corresponds to a number from 1 to 8.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { number: 1, letters: "A, I, J, Q, Y" },
                      { number: 2, letters: "B, K, R" },
                      { number: 3, letters: "C, G, L, S" },
                      { number: 4, letters: "D, M, T" },
                      { number: 5, letters: "E, H, N, X" },
                      { number: 6, letters: "U, V, W" },
                      { number: 7, letters: "O, Z" },
                      { number: 8, letters: "F, P" }
                    ].map((item) => (
                      <div key={item.number} className="bg-blue-600/20 rounded-lg p-3 text-center border border-slate-600 hover:bg-blue-600/30 transition-colors">
                        <div className="text-2xl font-bold text-pink-400 mb-2">{item.number}</div>
                        <div className="text-xs text-slate-300">{item.letters}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-orange-300">How It Works</h3>
                  <div className="space-y-3 text-slate-300">
                    <p>
                      Your name numbers are calculated by converting each letter in your name to its corresponding number, 
                      summing these numbers, and then reducing the sum to a single digit.
                    </p>
                    <p>
                      <strong className="text-orange-300">Destiny/Expression Number:</strong> Calculated using all letters in your name - reveals your life purpose and talents.
                    </p>
                    <p>
                      <strong className="text-orange-300">Soul Urge Number:</strong> Calculated using only vowels - reveals your inner desires and motivations.
                    </p>
                    <p>
                      <strong className="text-orange-300">Personality Number:</strong> Calculated using only consonants - reveals how others perceive you.
                    </p>
                  </div>
                  
                  <div className="bg-pink-600/10 border-l-4 border-pink-400 p-4 rounded-r-lg">
                    <p className="text-slate-300">
                      <strong className="text-pink-400">Note:</strong> Use your full birth name as it appears on your birth certificate for the most accurate calculation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default NumerologyCalculator;
