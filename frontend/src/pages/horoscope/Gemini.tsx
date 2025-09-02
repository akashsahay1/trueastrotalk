
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Gemini = () => {
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
            <h1 className="text-4xl font-bold mb-4">Gemini Horoscope</h1>
            <p className="text-xl opacity-90">Air Sign • May 21 - June 20</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Gemini</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Gemini is the third sign of the zodiac, symbolized by the Twins. As an air sign ruled by Mercury, Gemini individuals are known for their versatility, communication skills, and intellectual curiosity. They are adaptable, quick-witted, and have a natural ability to see multiple perspectives.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their sociability, charm, and love for learning. They thrive on variety and mental stimulation, often pursuing multiple interests simultaneously.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gemini Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Excellent communicators</li>
                    <li>• Adaptable and flexible</li>
                    <li>• Intellectually curious</li>
                    <li>• Witty and charming</li>
                    <li>• Quick learners</li>
                    <li>• Social and outgoing</li>
                    <li>• Versatile and multi-talented</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be inconsistent</li>
                    <li>• May lack focus</li>
                    <li>• Sometimes superficial</li>
                    <li>• Tendency to gossip</li>
                    <li>• Can be indecisive</li>
                    <li>• May avoid deep emotions</li>
                    <li>• Restless nature</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Gemini seek mental connection and stimulating conversation. They need partners who can match their wit and keep them intellectually engaged. They value freedom and variety in relationships.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Libra, Aquarius, Aries, and Leo tend to be most compatible with Gemini.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Gemini excel in careers that involve communication, writing, teaching, or media. They thrive in dynamic environments that offer variety and intellectual challenges. Their adaptability makes them successful in multiple fields.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Journalism, Teaching, Sales, Marketing, Writing, Broadcasting, Translation, and Technology.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Gemini should pay attention to their respiratory system, hands, and nervous system. They need mental stimulation and variety in their exercise routines. Stress management is important for their overall well-being.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Gemini Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                💫 Get Gemini Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Gemini;
