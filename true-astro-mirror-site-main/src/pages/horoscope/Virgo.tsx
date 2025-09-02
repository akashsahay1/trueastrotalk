
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Virgo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Virgo Horoscope</h1>
            <p className="text-xl opacity-90">Earth Sign • August 23 - September 22</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Virgo</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Virgo is the sixth sign of the zodiac, symbolized by the Virgin. As an earth sign ruled by Mercury, Virgo individuals are known for their analytical nature, attention to detail, and desire for perfection. They are practical, organized, and always striving to improve themselves and their surroundings.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their methodical approach to life, strong work ethic, and helpful nature. They have excellent problem-solving skills and a natural ability to see what needs to be fixed or improved.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Virgo Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Analytical and detail-oriented</li>
                    <li>• Reliable and hardworking</li>
                    <li>• Practical and organized</li>
                    <li>• Helpful and service-oriented</li>
                    <li>• Intelligent and logical</li>
                    <li>• Modest and humble</li>
                    <li>• Health-conscious</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be overly critical</li>
                    <li>• Tendency to worry</li>
                    <li>• May be perfectionist</li>
                    <li>• Sometimes shy</li>
                    <li>• Can be pessimistic</li>
                    <li>• May overthink situations</li>
                    <li>• Can be harsh on themselves</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Virgo are devoted, loyal, and practical partners. They show love through acts of service and attention to their partner's needs. They may take time to open up but are very committed once they do.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Taurus, Capricorn, Cancer, and Scorpio tend to be most compatible with Virgo.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Virgo excel in careers that require attention to detail, analysis, and service to others. They are excellent with money management and budgeting. They prefer stable, organized work environments.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Healthcare, Accounting, Research, Education, Administration, Quality Control, and Service industries.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Virgo should pay attention to their digestive system and overall health routines. They benefit from regular exercise and healthy eating habits. Stress and worry can affect their well-being.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Virgo Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🌿 Get Virgo Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Virgo;
