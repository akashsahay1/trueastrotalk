
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Sagittarius = () => {
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
            <h1 className="text-4xl font-bold mb-4">Sagittarius Horoscope</h1>
            <p className="text-xl opacity-90">Fire Sign • November 22 - December 21</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Sagittarius</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Sagittarius is the ninth sign of the zodiac, symbolized by the Archer. As a fire sign ruled by Jupiter, Sagittarius individuals are known for their adventurous spirit, philosophical nature, and love of freedom. They are optimistic explorers who seek truth and meaning in life.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their enthusiasm, honesty, and desire for knowledge. They have a natural wanderlust and are always seeking new experiences, cultures, and philosophical insights.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sagittarius Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Adventurous and free-spirited</li>
                    <li>• Optimistic and enthusiastic</li>
                    <li>• Honest and straightforward</li>
                    <li>• Philosophical and wise</li>
                    <li>• Generous and jovial</li>
                    <li>• Independent and freedom-loving</li>
                    <li>• Intellectual and curious</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be restless</li>
                    <li>• May be tactless</li>
                    <li>• Sometimes irresponsible</li>
                    <li>• Can be impatient</li>
                    <li>• May over-promise</li>
                    <li>• Tendency to be careless</li>
                    <li>• Can be preachy</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Sagittarius are fun-loving, adventurous, and need freedom in relationships. They seek partners who share their love of adventure and philosophical discussions. They are honest and direct in their approach to love.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Aries, Leo, Libra, and Aquarius tend to be most compatible with Sagittarius.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Sagittarius excel in careers involving travel, education, philosophy, or publishing. They need variety and freedom in their work. They can be generous with money but need to learn financial discipline.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Travel, Education, Publishing, Philosophy, Sports, Law, and International business.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Sagittarius should pay attention to their hips, thighs, and liver. They need regular physical activity and outdoor exercise. They should be careful of accidents due to their adventurous nature.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-red-400 to-orange-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Sagittarius Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🏹 Get Sagittarius Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Sagittarius;
