
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Aries = () => {
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
            <h1 className="text-4xl font-bold mb-4">Aries Horoscope</h1>
            <p className="text-xl opacity-90">Fire Sign • March 21 - April 19</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Aries</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Aries is the first sign of the zodiac, symbolized by the Ram. As a fire sign ruled by Mars, Aries individuals are known for their dynamic energy, leadership qualities, and pioneering spirit. They are natural-born leaders who aren't afraid to take risks and venture into uncharted territory.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their enthusiasm, courage, and determination. They have a strong desire to be first in everything they do and possess an infectious optimism that inspires others around them.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Aries Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Courageous and brave</li>
                    <li>• Natural leadership abilities</li>
                    <li>• Enthusiastic and energetic</li>
                    <li>• Independent and self-reliant</li>
                    <li>• Honest and straightforward</li>
                    <li>• Competitive and ambitious</li>
                    <li>• Quick decision-makers</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be impulsive at times</li>
                    <li>• May lack patience</li>
                    <li>• Sometimes aggressive</li>
                    <li>• Can be self-centered</li>
                    <li>• Tendency to be short-tempered</li>
                    <li>• May not listen to others</li>
                    <li>• Can be overly competitive</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Aries are passionate, direct, and somewhat possessive. They fall in love quickly and aren't afraid to make the first move. Aries need a partner who can match their energy and independence while also appreciating their protective nature.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Leo, Sagittarius, Gemini, and Aquarius tend to be most compatible with Aries.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Aries excel in careers that allow them to lead, innovate, and take charge. They thrive in fast-paced environments and prefer jobs that offer variety and challenge. Natural entrepreneurs, they often start their own businesses.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Entrepreneurship, Sales, Military, Sports, Politics, Emergency Services, and Leadership roles.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Aries should pay attention to their head, as it's their ruling body part. They need regular physical exercise to channel their abundant energy constructively. Stress management and patience development are crucial for their overall well-being.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-red-400 to-orange-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Aries Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🔥 Get Aries Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Aries;
