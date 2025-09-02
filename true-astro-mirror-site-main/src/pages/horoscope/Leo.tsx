
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Leo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-red-400 to-orange-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Leo Horoscope</h1>
            <p className="text-xl opacity-90">Fire Sign • July 23 - August 22</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Leo</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Leo is the fifth sign of the zodiac, symbolized by the Lion. As a fire sign ruled by the Sun, Leo individuals are known for their confidence, leadership, and dramatic flair. They are natural performers who love to be in the spotlight and inspire others with their enthusiasm.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their generosity, warmth, and strong sense of pride. They have a natural magnetism that draws people to them and possess an innate ability to lead and motivate others.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Leo Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Confident and charismatic</li>
                    <li>• Natural leader</li>
                    <li>• Generous and warm-hearted</li>
                    <li>• Creative and artistic</li>
                    <li>• Loyal and protective</li>
                    <li>• Optimistic and cheerful</li>
                    <li>• Dramatic and entertaining</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be arrogant</li>
                    <li>• May seek constant attention</li>
                    <li>• Sometimes domineering</li>
                    <li>• Can be stubborn</li>
                    <li>• May have inflated ego</li>
                    <li>• Tendency to be dramatic</li>
                    <li>• Can be self-centered</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Leo are passionate, romantic, and generous partners. They love grand gestures and being adored by their partner. They need appreciation and admiration in relationships and are very loyal once committed.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Aries, Sagittarius, Gemini, and Libra tend to be most compatible with Leo.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Leo excel in careers that put them in the spotlight or leadership positions. They thrive in creative fields, entertainment, and roles that allow them to inspire others. They are good at managing finances when focused.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Entertainment, Management, Politics, Teaching, Fashion, Arts, Public Relations, and Leadership roles.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Leo should pay attention to their heart, spine, and back. They need regular exercise to maintain their energy levels. Stress from overwork or ego conflicts can affect their health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-red-400 to-orange-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Leo Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                ☀️ Get Leo Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Leo;
