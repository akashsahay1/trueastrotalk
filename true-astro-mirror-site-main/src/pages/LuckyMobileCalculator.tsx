import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CalculationResults {
  mobileTotal: number;
  lifePath: number;
  mainPlanet: number;
  luckType: 'lucky' | 'neutral' | 'unlucky';
  luckMessage: string;
  recommendations: {
    best: number[];
    good: number[];
    current: number;
  };
}

const LuckyMobileCalculator = () => {
  const [mobile, setMobile] = useState('9507000066');
  const [day, setDay] = useState(8);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(1988);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  const reduceToSingleDigit = (num: number): number => {
    while (num > 9) {
      let sum = 0;
      while (num > 0) {
        sum += num % 10;
        num = Math.floor(num / 10);
      }
      num = sum;
    }
    return num;
  };

  const calculateMobileNumber = (mobile: string): number => {
    const digits = mobile.replace(/\D/g, '');
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i]);
    }
    return reduceToSingleDigit(sum);
  };

  const calculateLifePath = (day: number, month: number, year: number): number => {
    const daySum = reduceToSingleDigit(day);
    const monthSum = reduceToSingleDigit(month);
    const yearSum = reduceToSingleDigit(year);
    const total = daySum + monthSum + yearSum;
    return reduceToSingleDigit(total);
  };

  const calculateMainPlanet = (day: number): number => {
    return reduceToSingleDigit(day);
  };

  const determineLuck = (mobileTotal: number, lifePath: number, mainPlanet: number) => {
    const compatible: { [key: number]: number[] } = {
      1: [1, 3, 5, 9],
      2: [2, 6, 8, 9],
      3: [1, 3, 5, 6, 9],
      4: [2, 4, 6, 8],
      5: [1, 3, 5, 9],
      6: [2, 3, 6, 9],
      7: [2, 7, 9],
      8: [2, 4, 6, 8],
      9: [1, 2, 3, 6, 9]
    };

    const lifePathMatch = compatible[lifePath]?.includes(mobileTotal) || false;
    const planetMatch = compatible[mainPlanet]?.includes(mobileTotal) || false;

    if (lifePathMatch && planetMatch) {
      return { type: 'lucky' as const, message: 'यह मोबाइल नंबर आपके लिए बहुत ही शुभ है!' };
    } else if (lifePathMatch || planetMatch) {
      return { type: 'neutral' as const, message: 'यह मोबाइल नंबर आपके लिए ठीक-ठाक है, लेकिन इसे और बेहतर बनाया जा सकता है।' };
    } else {
      return { type: 'unlucky' as const, message: 'यह मोबाइल नंबर आपके लिए शुभ नहीं है, इसे बदलने पर विचार करें।' };
    }
  };

  const getRecommendations = (lifePath: number, mainPlanet: number, current: number) => {
    const compatible: { [key: number]: number[] } = {
      1: [1, 3, 5, 9], 2: [2, 6, 8, 9], 3: [1, 3, 5, 6, 9], 4: [2, 4, 6, 8],
      5: [1, 3, 5, 9], 6: [2, 3, 6, 9], 7: [2, 7, 9], 8: [2, 4, 6, 8], 9: [1, 2, 3, 6, 9]
    };

    const lifePathCompat = compatible[lifePath] || [];
    const planetCompat = compatible[mainPlanet] || [];
    
    const best: number[] = [], good: number[] = [];
    
    for (let i = 1; i <= 9; i++) {
      if (lifePathCompat.includes(i) && planetCompat.includes(i)) {
        best.push(i);
      } else if (lifePathCompat.includes(i) || planetCompat.includes(i)) {
        good.push(i);
      }
    }

    return { best: best.sort(), good: good.sort(), current };
  };

  const calculate = () => {
    const mobileNumber = mobile.trim();
    
    if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 10) {
      alert('कृपया कम से कम 10 अंकों का एक मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }
    
    if (isNaN(day) || isNaN(month) || isNaN(year) || 
        day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
      alert('कृपया अपनी पूरी जन्म तिथि सही फॉर्मेट में दर्ज करें।');
      return;
    }

    const mobileTotal = calculateMobileNumber(mobile);
    const lifePath = calculateLifePath(day, month, year);
    const mainPlanet = calculateMainPlanet(day);
    const luck = determineLuck(mobileTotal, lifePath, mainPlanet);
    const recommendations = getRecommendations(lifePath, mainPlanet, mobileTotal);

    setResults({
      mobileTotal,
      lifePath,
      mainPlanet,
      luckType: luck.type,
      luckMessage: luck.message,
      recommendations
    });
    setShowResults(true);
  };

  const getLuckColorClass = (type: string) => {
    switch (type) {
      case 'lucky': return 'bg-green-500';
      case 'neutral': return 'bg-yellow-500';
      case 'unlucky': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatus = (current: number, best: number[], good: number[]) => {
    if (best.includes(current)) return '✅ बहुत बढ़िया!';
    if (good.includes(current)) return '👍 अच्छा है';
    return '⚠️ सुधार की ज़रूरत है';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto bg-card rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center py-12">
            <h1 className="text-4xl font-bold mb-2">Lucky Mobile Number Calculator</h1>
            <p className="text-lg opacity-80">अपने मोबाइल नंबर की अनुकूलता और प्रभाव जानें।</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 bg-muted/30">
              <h2 className="text-2xl font-semibold text-foreground mb-6">अपनी जानकारी दर्ज करें</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="mobile" className="text-base font-semibold text-foreground">मोबाइल नंबर</Label>
                  <Input
                    type="text"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="मोबाइल नंबर दर्ज करें"
                    className="mt-2 p-3 text-base"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold text-foreground mb-3 block">जन्म तिथि</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      value={day}
                      onChange={(e) => setDay(parseInt(e.target.value) || 0)}
                      placeholder="DD"
                      min="1"
                      max="31"
                      className="text-center p-3"
                    />
                    <Input
                      type="number"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value) || 0)}
                      placeholder="MM"
                      min="1"
                      max="12"
                      className="text-center p-3"
                    />
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                      placeholder="YYYY"
                      min="1900"
                      max="2030"
                      className="text-center p-3"
                    />
                  </div>
                </div>

                <Button 
                  onClick={calculate}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-4 text-lg"
                >
                  गणना करें
                </Button>
              </div>
            </div>

            <div className="p-10 bg-secondary text-secondary-foreground">
              {showResults && results ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4 border-b border-secondary-foreground/20 pb-2">आपके परिणाम</h3>
                  
                  <Card className="bg-secondary-foreground/10 border-secondary-foreground/20">
                    <CardContent className="p-4">
                      <table className="w-full text-secondary-foreground">
                        <thead>
                          <tr className="border-b border-secondary-foreground/20">
                            <th className="text-left py-2">न्यूमेरोलॉजी अंक</th>
                            <th className="text-left py-2">मान</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2">जन्म अंक</td>
                            <td className="py-2">{results.mainPlanet}</td>
                          </tr>
                          <tr>
                            <td className="py-2">भाग्यंक</td>
                            <td className="py-2">{results.lifePath}</td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary-foreground/15 border-secondary-foreground/20">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm mb-2">आपके मोबाइल नंबर का योग है</p>
                      <div className="text-5xl font-bold mb-2">{results.mobileTotal}</div>
                    </CardContent>
                  </Card>

                  <Card className={`${getLuckColorClass(results.luckType)} border-secondary-foreground/20`}>
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-white">{results.luckMessage}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary-foreground/10 border-secondary-foreground/20">
                    <CardHeader>
                      <CardTitle className="text-secondary-foreground text-base">📱 नंबर चुनने की गाइड</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-sm space-y-3">
                      <div className="bg-secondary-foreground/10 p-3 rounded">
                        <strong>🎯 आपके व्यक्तिगत अंक:</strong><br />
                        जन्म अंक: {results.mainPlanet} | भाग्यंक: {results.lifePath}
                      </div>
                      
                      <div className="bg-green-500/30 p-3 rounded">
                        <strong>✅ सबसे शुभ नंबर: {results.recommendations.best.length > 0 ? results.recommendations.best.join(', ') : 'कोई नहीं'}</strong><br />
                        <small>ये नंबर्स आपके लिए सबसे ज़्यादा भाग्यशाली हैं।</small>
                      </div>
                      
                      <div className="bg-yellow-500/30 p-3 rounded">
                        <strong>⚡ अच्छे नंबर: {results.recommendations.good.length > 0 ? results.recommendations.good.join(', ') : 'कोई नहीं'}</strong><br />
                        <small>ये भी अच्छे विकल्प हैं।</small>
                      </div>
                      
                      <div className="bg-secondary-foreground/10 p-3 rounded">
                        <strong>📱 मौजूदा नंबर का योग:</strong> {results.recommendations.current} {getStatus(results.recommendations.current, results.recommendations.best, results.recommendations.good)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-2xl font-semibold mb-4">आपके परिणाम यहाँ दिखेंगे</h3>
                  <p className="text-lg opacity-80">अपनी जानकारी भरें और 'गणना करें' पर क्लिक करें</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LuckyMobileCalculator;