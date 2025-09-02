
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Palmistry = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Palmistry About</h1>
            <p className="text-xl opacity-90">The ancient art of reading palms to understand life's journey</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Cosmic Blueprint of Your Destiny</h2>
              <p className="text-gray-700 leading-relaxed">
                Palmistry, also known as chiromancy or palm reading, is an ancient practice that reveals the 
                secrets of your life through the lines, mounts, and shapes of your hands. Your palms contain 
                a detailed map of your personality, relationships, career prospects, health tendencies, and 
                life events that are destined to unfold.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Concepts</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Planetary Positions</h3>
                  <p className="text-blue-800">The 12 zodiac signs and 27 nakshatras influence various aspects of your palm lines and mounts.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Zodiac Signs (12)</h3>
                  <p className="text-green-800">Each zodiac sign corresponds to specific palm characteristics and personality traits.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Nakshatras (27)</h3>
                  <p className="text-purple-800">Lunar mansions that provide deeper insights into your destiny and life path.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Hand Shapes</h3>
                  <p className="text-orange-800">Different hand shapes reveal fundamental personality types and life approaches.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Major Palm Lines</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Life Line - Reveals vitality, health, and major life changes
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Heart Line - Shows emotional nature, relationships, and love life
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Head Line - Indicates intelligence, thinking patterns, and decision-making
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Fate Line - Reveals career path, success, and life direction
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Marriage Lines - Show relationship patterns and marriage prospects
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Money Lines - Indicate financial success and wealth accumulation
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Seven Mounts</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Jupiter (Leadership)</h3>
                  <p className="text-gray-700">Ambition, confidence, and leadership qualities</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Saturn (Discipline)</h3>
                  <p className="text-gray-700">Responsibility, discipline, and serious nature</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Sun (Creativity)</h3>
                  <p className="text-gray-700">Artistic abilities, fame, and creative expression</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Mercury (Communication)</h3>
                  <p className="text-gray-700">Business acumen, communication skills</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Mars (Energy)</h3>
                  <p className="text-gray-700">Courage, aggression, and physical strength</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Venus (Love)</h3>
                  <p className="text-gray-700">Love, beauty, and emotional relationships</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-bold text-gray-900">Mount of Moon (Intuition)</h3>
                  <p className="text-gray-700">Imagination, intuition, and psychic abilities</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Discover Your Palm's Secrets</h3>
              <p className="mb-4">Get a detailed palmistry reading from our expert palm readers</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🤚 Get Palm Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Palmistry;
