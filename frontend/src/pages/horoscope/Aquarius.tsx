
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Aquarius = () => {
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
            <h1 className="text-4xl font-bold mb-4">Aquarius Horoscope</h1>
            <p className="text-xl opacity-90">Air Sign • January 20 - February 18</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Aquarius</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Aquarius is the eleventh sign of the zodiac, symbolized by the Water Bearer. As an air sign ruled by Uranus and Saturn, Aquarius individuals are known for their innovative thinking, humanitarian nature, and unique perspective on life. They are progressive visionaries who value freedom and individuality.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their independence, originality, and desire to make the world a better place. They are often ahead of their time and have a natural ability to see the bigger picture and future possibilities.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Aquarius Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Independent and original</li>
                    <li>• Humanitarian and altruistic</li>
                    <li>• Innovative and progressive</li>
                    <li>• Intellectual and analytical</li>
                    <li>• Friendly and social</li>
                    <li>• Visionary and futuristic</li>
                    <li>• Unique and eccentric</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be aloof</li>
                    <li>• May be unpredictable</li>
                    <li>• Sometimes stubborn</li>
                    <li>• Can be emotionally detached</li>
                    <li>• May be rebellious</li>
                    <li>• Tendency to be impersonal</li>
                    <li>• Can be inconsistent</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Aquarius are independent, friendly, and need freedom in relationships. They seek intellectual connection and friendship as the foundation of love. They value individuality and respect their partner's independence.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Gemini, Libra, Aries, and Sagittarius tend to be most compatible with Aquarius.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Aquarius excel in careers involving technology, innovation, humanitarian work, or social causes. They need freedom and creativity in their work. They may have unconventional approaches to money management.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Technology, Science, Social work, Innovation, Astrology, Research, and Humanitarian work.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Aquarius should pay attention to their circulatory system, ankles, and nervous system. They need mental stimulation and social interaction for their well-being. Stress from feeling restricted can affect their health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Aquarius Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🏺 Get Aquarius Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Aquarius;
