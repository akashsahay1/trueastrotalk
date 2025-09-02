
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Tarot = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Tarot About</h1>
            <p className="text-xl opacity-90">Mystical tarot card readings that provide guidance and insights into your future</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Cosmic Clock & Karmic Calendar</h2>
              <p className="text-gray-700 leading-relaxed">
                Tarot reading is a form of divination using a deck of 78 cards to gain insight into the past, 
                present, and future. Each card has symbolic meanings that help understand life situations, 
                relationships, career prospects, and spiritual growth. Our tarot readings combine traditional 
                interpretations with intuitive insights for accurate guidance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tarot Card Categories</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Major Arcana (22 Cards)</h3>
                  <p className="text-blue-800">Represents major life themes, spiritual lessons, and karmic influences</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Minor Arcana (56 Cards)</h3>
                  <p className="text-green-800">Covers daily life situations, emotions, and practical matters</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Court Cards (16 Cards)</h3>
                  <p className="text-purple-800">Represents personality types and people in your life</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Four Suits</h3>
                  <p className="text-orange-800">Cups (emotions), Wands (action), Swords (thoughts), Pentacles (material)</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Tarot Spreads</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Celtic Cross Spread</h3>
                  <p className="text-gray-700">Comprehensive 10-card spread for detailed life analysis</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Three-Card Spread</h3>
                  <p className="text-gray-700">Past, Present, Future or Situation, Action, Outcome</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900">Relationship Spread</h3>
                  <p className="text-gray-700">Specialized spread for love and relationship guidance</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">Career Spread</h3>
                  <p className="text-gray-700">Professional guidance and career decision-making</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Tarot Reading Reveals</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Hidden influences affecting your current situation
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Guidance for important life decisions and choices
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Insights into relationships and emotional patterns
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Career opportunities and professional growth
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Spiritual guidance and personal development
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Timing of future events and opportunities
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Unlock Your Future with Tarot</h3>
              <p className="mb-4">Get personalized tarot card readings for clarity and guidance</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🔮 Get Tarot Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Tarot;
