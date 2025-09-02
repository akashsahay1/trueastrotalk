
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Taurus = () => {
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
            <h1 className="text-4xl font-bold mb-4">Taurus Horoscope</h1>
            <p className="text-xl opacity-90">Earth Sign • April 20 - May 20</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Taurus</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Taurus is the second sign of the zodiac, symbolized by the Bull. As an earth sign ruled by Venus, Taurus individuals are known for their practicality, reliability, and love for beauty and comfort. They are grounded, stable, and have a strong appreciation for the finer things in life.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their patience, determination, and loyalty. They prefer stability and security in all aspects of life and are known for their unwavering persistence in achieving their goals.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Taurus Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Reliable and dependable</li>
                    <li>• Patient and persistent</li>
                    <li>• Practical and grounded</li>
                    <li>• Loyal and devoted</li>
                    <li>• Appreciates beauty and art</li>
                    <li>• Strong work ethic</li>
                    <li>• Generous and kind</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be stubborn</li>
                    <li>• Resistant to change</li>
                    <li>• May be materialistic</li>
                    <li>• Sometimes possessive</li>
                    <li>• Can be lazy at times</li>
                    <li>• Tendency to overindulge</li>
                    <li>• May hold grudges</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Taurus are devoted, sensual, and seek long-term stability. They prefer committed relationships and are very loyal partners. They express love through physical affection, gifts, and creating a comfortable home environment.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Virgo, Capricorn, Cancer, and Pisces tend to be most compatible with Taurus.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Taurus excel in careers that offer stability, security, and tangible results. They are excellent with money management and often succeed in fields related to finance, real estate, agriculture, or the arts.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Banking, Real Estate, Agriculture, Arts, Cooking, Fashion, Architecture, and Investment.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Taurus should pay attention to their throat, neck, and thyroid. They need to maintain a balanced diet and regular exercise routine to avoid weight gain. Stress from overwork can affect their overall health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Taurus Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🌱 Get Taurus Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Taurus;
