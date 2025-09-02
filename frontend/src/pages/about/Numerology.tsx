
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Numerology = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Numerology About</h1>
            <p className="text-xl opacity-90">The mystical relationship between numbers and life events, personality traits</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Numerology?</h2>
              <p className="text-gray-700 leading-relaxed">
                Numerology is the belief in the mystical relationship between numbers and life events. It studies 
                the numerical value of names, birth dates, and other significant numbers to understand personality 
                traits, predict future events, and guide important life decisions. Each number carries specific 
                vibrations and meanings that influence our lives.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Numbers in Numerology</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Life Path Number</h3>
                  <p className="text-blue-800">Calculated from birth date - reveals your life's purpose and direction</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Destiny Number</h3>
                  <p className="text-green-800">Based on full name - shows your life's mission and goals</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Soul Urge Number</h3>
                  <p className="text-purple-800">From vowels in name - reveals inner desires and motivations</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Personality Number</h3>
                  <p className="text-orange-800">From consonants - shows how others perceive you</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Number Meanings (1-9)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">1</h3>
                  <p className="text-gray-700">Leadership, Independence, Innovation</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">2</h3>
                  <p className="text-gray-700">Cooperation, Sensitivity, Diplomacy</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">3</h3>
                  <p className="text-gray-700">Creativity, Communication, Expression</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">4</h3>
                  <p className="text-gray-700">Stability, Hard Work, Organization</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">5</h3>
                  <p className="text-gray-700">Freedom, Adventure, Change</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">6</h3>
                  <p className="text-gray-700">Nurturing, Responsibility, Healing</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">7</h3>
                  <p className="text-gray-700">Spirituality, Analysis, Mystery</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">8</h3>
                  <p className="text-gray-700">Material Success, Authority, Ambition</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-bold text-cyan-900 text-2xl mb-2">9</h3>
                  <p className="text-gray-700">Completion, Humanitarianism, Wisdom</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Applications of Numerology</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Name analysis for personal and business purposes
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Choosing auspicious dates for important events
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Compatibility analysis for relationships and partnerships
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Career guidance based on numerical strengths
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Lucky number identification for various purposes
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                  Personal year predictions and life cycle analysis
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Discover Your Numbers</h3>
              <p className="mb-4">Get detailed numerology analysis for personal and professional guidance</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🔢 Get Numerology Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Numerology;
