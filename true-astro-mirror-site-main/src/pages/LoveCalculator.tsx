
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, User, Users, Star, Redo } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LoveCalculator = () => {
  const [showResult, setShowResult] = useState(false);
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [yourGender, setYourGender] = useState("male");
  const [partnerGender, setPartnerGender] = useState("female");
  const [lovePercentage, setLovePercentage] = useState(0);

  const loveQuotes = [
    "Your love will be a masterpiece, crafted with care and devotion.",
    "In each other's arms, you will find the perfect balance between passion and serenity.",
    "True love is not about perfection, but embracing each other's imperfections.",
    "The best thing to hold onto in life is each other.",
    "Love is composed of a single soul inhabiting two bodies.",
    "We are most alive when we're in love.",
    "The greatest happiness of life is the conviction that we are loved.",
    "Love doesn't make the world go round. Love is what makes the ride worthwhile.",
    "To love and be loved is to feel the sun from both sides.",
    "Love is when the other person's happiness is more important than your own."
  ];

  const compatibilityMessages = [
    { min: 90, text: "Perfect Match! Soulmates Forever", emoji: "💖" },
    { min: 75, text: "Excellent Compatibility! True Love", emoji: "💕" },
    { min: 60, text: "Great Match! Strong Potential", emoji: "💘" },
    { min: 45, text: "Good Compatibility! Worth Exploring", emoji: "❤️" },
    { min: 30, text: "Moderate Compatibility! Needs Effort", emoji: "💓" },
    { min: 0, text: "Low Compatibility! Challenging Path", emoji: "💔" }
  ];

  const calculateLovePercentage = (name1: string, name2: string) => {
    // Simple algorithm for fun
    let base = Math.abs(name1.length - name2.length) * 5;
    let randFactor = Math.floor(Math.random() * 30);
    let calculated = 75 + randFactor - base;
    
    // Ensure result is between 10-99
    calculated = Math.max(10, Math.min(99, calculated));
    
    return calculated;
  };

  const getCompatibilityText = (percentage: number) => {
    for (const message of compatibilityMessages) {
      if (percentage >= message.min) {
        return message.text + " " + message.emoji;
      }
    }
    return compatibilityMessages[compatibilityMessages.length - 1].text;
  };

  const handleCalculate = () => {
    const name1 = yourName || "You";
    const name2 = partnerName || "Your Partner";
    const percentage = calculateLovePercentage(name1, name2);
    setLovePercentage(percentage);
    setShowResult(true);
  };

  const handleCalculateAgain = () => {
    setShowResult(false);
    setYourName("");
    setPartnerName("");
  };

  const getRandomQuote = () => {
    return loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-200">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-center py-12 px-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20"></div>
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Love Calculator</h1>
                <p className="text-xl opacity-90 mb-6">Love Meter To Calculate Love Percentage</p>
                <div className="flex justify-center gap-4">
                  <Heart className="w-8 h-8 animate-pulse" />
                  <Heart className="w-8 h-8 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Heart className="w-8 h-8 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12">
              {!showResult ? (
                /* Form View */
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-center text-pink-600 mb-8">
                    Find Love (Percentage)% Between
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Your Details */}
                    <div className="bg-pink-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-pink-800 mb-6 flex items-center gap-3">
                        <User className="w-6 h-6" />
                        Your Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="your-name">Your Name</Label>
                          <Input
                            id="your-name"
                            value={yourName}
                            onChange={(e) => setYourName(e.target.value)}
                            placeholder="Enter Your Name"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label>Gender</Label>
                          <RadioGroup 
                            value={yourGender} 
                            onValueChange={setYourGender}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="your-male" />
                              <Label htmlFor="your-male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="your-female" />
                              <Label htmlFor="your-female">Female</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>

                    {/* Partner's Details */}
                    <div className="bg-rose-50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-rose-800 mb-6 flex items-center gap-3">
                        <Heart className="w-6 h-6" />
                        Partner's Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="partner-name">Partner's Name</Label>
                          <Input
                            id="partner-name"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder="Enter Partner's Name"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label>Gender</Label>
                          <RadioGroup 
                            value={partnerGender} 
                            onValueChange={setPartnerGender}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="partner-male" />
                              <Label htmlFor="partner-male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="partner-female" />
                              <Label htmlFor="partner-female">Female</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote Box */}
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-500 p-6 rounded-r-2xl mb-8">
                    <p className="text-lg italic text-gray-700 mb-2">
                      "Your love will be a masterpiece, crafted with care and devotion."
                    </p>
                    <p className="text-right text-pink-600 font-semibold">- Love Quote of the Day</p>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                    <p className="text-gray-700 mb-4">
                      Love, they say, is both an art and a science. Our Love Calculator blends the two seamlessly, 
                      creating a captivating experience that leaves you craving for more. This extraordinary tool 
                      is designed to unravel the mysteries of love and compatibility.
                    </p>
                    <p className="text-gray-700">
                      Powered by insightful astrological calculations, this captivating feature delves into the 
                      cosmic connections between two individuals and provides an in-depth analysis of their 
                      relationship potential.
                    </p>
                  </div>

                  {/* Calculate Button */}
                  <div className="text-center">
                    <Button 
                      onClick={handleCalculate}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-12 py-4 text-lg font-semibold rounded-full"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Calculate Love%
                    </Button>
                  </div>
                </div>
              ) : (
                /* Result View */
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-bold text-pink-600 mb-6">Your Love Percentage</h2>
                  
                  <div className="text-2xl font-semibold text-gray-800 mb-8">
                    {yourName || "You"} & {partnerName || "Your Partner"}
                  </div>

                  <div className="relative mb-8">
                    <div className="text-8xl font-bold text-pink-600 mb-4 relative">
                      {lovePercentage}
                      <span className="text-4xl absolute top-2 -right-8">%</span>
                    </div>
                    <div className="text-2xl font-semibold text-pink-800">
                      {getCompatibilityText(lovePercentage)}
                    </div>
                  </div>

                  {/* Quote Box */}
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-500 p-6 rounded-r-2xl mb-8">
                    <p className="text-lg italic text-gray-700 mb-2">
                      "{getRandomQuote()}"
                    </p>
                    <p className="text-right text-pink-600 font-semibold">- Today's Love Quote</p>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
                    <p className="text-gray-700 mb-4">
                      This innovative tool not only assesses the romantic compatibility between two individuals 
                      but also provides guidance on various areas. It sheds light on the unique qualities that 
                      each partner brings to the relationship, helping them navigate the intricacies of love 
                      with greater understanding and harmony.
                    </p>
                    <p className="text-gray-700">
                      Curious if your partner is truly your soulmate? Our love tester offers a playful way to 
                      understand your compatibility. You can even go deeper with zodiac signs compatibility to 
                      see how your sun signs align.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button 
                      onClick={handleCalculateAgain}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full"
                    >
                      <Redo className="w-5 h-5 mr-2" />
                      Calculate Again
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-pink-600 text-pink-600 hover:bg-pink-50 px-8 py-3 rounded-full"
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Get Today's Love Horoscope
                    </Button>
                  </div>
                </div>
              )}

              {/* FAQs Section */}
              <div className="mt-16 bg-gray-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-center text-pink-600 mb-8">
                  Frequently Asked Questions
                </h3>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      Is the love calculator true?
                    </h4>
                    <p className="text-gray-700">
                      Love calculators are fun and often based on names or zodiac signs. They aren't scientifically 
                      accurate but can offer light-hearted insight. Think of them more as entertainment than reality, 
                      though they might spark meaningful thoughts about your relationship or crush!
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      How to calculate love percentage?
                    </h4>
                    <p className="text-gray-700">
                      Most love percentage calculators use names, birth dates, or zodiac signs. Just enter your and 
                      your partner's details, and the tool generates a "love score" based on numerology or compatibility 
                      formulas. It's a fun way to explore vibes, not a concrete measure of love.
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      What is a love meter calculator and how does it work?
                    </h4>
                    <p className="text-gray-700">
                      A love meter calculator compares names or zodiac signs to give a "compatibility score." It uses 
                      basic algorithms, numerology, or astrology to show how well two people match. It's mostly for fun 
                      and curiosity, but sometimes feels surprisingly accurate!
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      How can I take a love compatibility test?
                    </h4>
                    <p className="text-gray-700">
                      You can easily take a love compatibility test online—just enter names, birth dates, or zodiac signs. 
                      Some also include personality questions. These tests use numerology, astrology, or psychology to 
                      estimate how well you match with someone emotionally and mentally.
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

export default LoveCalculator;
