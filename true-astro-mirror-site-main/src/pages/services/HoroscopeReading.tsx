
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const HoroscopeReading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Horoscope Reading</h1>
            <p className="text-xl opacity-90">Get detailed horoscope reading and predictions</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Horoscope Reading</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Horoscope reading is the art of interpreting celestial movements and their influence on human life. Your horoscope reveals insights about your personality, relationships, career, health, and future prospects based on the positions of planets at the time of your birth.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our expert astrologers provide comprehensive horoscope analysis that helps you understand your life's journey, make informed decisions, and prepare for upcoming opportunities and challenges.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Horoscope Reading Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-violet-50 p-6 rounded-lg">
                  <h3 className="font-bold text-violet-900 mb-4">Birth Chart Analysis</h3>
                  <ul className="space-y-2 text-violet-800">
                    <li>• Complete kundli reading</li>
                    <li>• Planetary positions analysis</li>
                    <li>• House-wise predictions</li>
                    <li>• Dasha and antardasha</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Daily Predictions</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Daily horoscope</li>
                    <li>• Weekly forecasts</li>
                    <li>• Monthly predictions</li>
                    <li>• Yearly overview</li>
                  </ul>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="font-bold text-indigo-900 mb-4">Life Areas Analysis</h3>
                  <ul className="space-y-2 text-indigo-800">
                    <li>• Career and profession</li>
                    <li>• Love and relationships</li>
                    <li>• Health and wellness</li>
                    <li>• Finance and wealth</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-4">Transit Analysis</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Current planetary transits</li>
                    <li>• Saturn and Jupiter effects</li>
                    <li>• Eclipse impacts</li>
                    <li>• Retrograde influences</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Your Horoscope Reveals</h2>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-purple-900">Personality Traits</h4>
                    <p className="text-purple-800">Your strengths, weaknesses, natural talents, and behavioral patterns.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Life Purpose</h4>
                    <p className="text-purple-800">Your soul's mission, dharma, and spiritual journey in this lifetime.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Relationship Patterns</h4>
                    <p className="text-purple-800">How you connect with others, compatibility factors, and relationship challenges.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Career Path</h4>
                    <p className="text-purple-800">Your professional inclinations, best career choices, and success timing.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Horoscope Readings</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-rose-50 p-4 rounded-lg">
                  <h4 className="font-bold text-rose-900 mb-2">Vedic Horoscope</h4>
                  <p className="text-rose-800 text-sm">Traditional Indian astrology based on sidereal zodiac system.</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-bold text-orange-900 mb-2">Western Horoscope</h4>
                  <p className="text-orange-800 text-sm">Based on tropical zodiac focusing on personality traits.</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-bold text-teal-900 mb-2">Chinese Horoscope</h4>
                  <p className="text-teal-800 text-sm">Based on lunar calendar with 12 animal signs cycle.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits of Regular Horoscope Reading</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Better understanding of your life patterns
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Informed decision-making for important choices
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Preparation for upcoming challenges and opportunities
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Improved relationships through understanding compatibility
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Enhanced self-awareness and personal growth
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-3"></span>
                  Timing guidance for important life events
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Horoscope Reading</h3>
              <p className="mb-4">Discover what the stars reveal about your life and future</p>
              <Button className="bg-white text-violet-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                ⭐ Get Horoscope Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default HoroscopeReading;
