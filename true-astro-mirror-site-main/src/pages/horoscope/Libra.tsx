
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Libra = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Libra Horoscope</h1>
            <p className="text-xl opacity-90">Air Sign • September 23 - October 22</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Libra</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Libra is the seventh sign of the zodiac, symbolized by the Scales. As an air sign ruled by Venus, Libra individuals are known for their love of balance, harmony, and beauty. They are natural diplomats who seek fairness and justice in all aspects of life.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their charm, social skills, and desire for partnership. They have a natural appreciation for art, beauty, and refined things, and they work hard to maintain peace and harmony in their relationships.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Libra Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Diplomatic and fair</li>
                    <li>• Charming and social</li>
                    <li>• Aesthetic and artistic</li>
                    <li>• Peaceful and harmonious</li>
                    <li>• Cooperative and romantic</li>
                    <li>• Balanced and just</li>
                    <li>• Refined and cultured</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be indecisive</li>
                    <li>• May avoid confrontation</li>
                    <li>• Sometimes superficial</li>
                    <li>• Can be codependent</li>
                    <li>• May be people-pleasing</li>
                    <li>• Tendency to procrastinate</li>
                    <li>• Can be vain</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Libra are romantic, charming, and seek harmony and balance in relationships. They are natural partners who thrive in committed relationships and value fairness and mutual respect with their partner.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Gemini, Aquarius, Leo, and Sagittarius tend to be most compatible with Libra.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Libra excel in careers involving beauty, art, law, or diplomacy. They work well in partnerships and team environments. They may struggle with financial decisions due to their indecisive nature but appreciate beautiful things.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Law, Diplomacy, Arts, Fashion, Interior Design, Counseling, Public Relations, and Mediation.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Libra should pay attention to their kidneys, lower back, and skin. They benefit from balanced diet and exercise routines. Stress from relationship conflicts can affect their health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Libra Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                ⚖️ Get Libra Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Libra;
