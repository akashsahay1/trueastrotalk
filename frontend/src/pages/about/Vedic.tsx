
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Vedic = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Vedic About</h1>
            <p className="text-xl opacity-90">The ancient science of Vedic astrology based on sacred Hindu scriptures</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vastu Shastra: The Sacred Harmony of Nature and Architecture</h2>
              <p className="text-gray-700 leading-relaxed">
                Vedic astrology, also known as Jyotish, is the traditional Hindu system of astrology that originated 
                from the Vedas - the oldest sacred texts of Hindu philosophy. This ancient science combines cosmic 
                energies with earthly influences to provide deep insights into human life, karma, dharma, and 
                spiritual evolution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Principles: Balance of Panchabhutas</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Sidereal Zodiac</h3>
                  <p className="text-blue-800">Uses the actual star positions rather than the tropical zodiac, providing more accurate readings.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Karma and Dharma</h3>
                  <p className="text-green-800">Focuses on understanding past life karma and present life purpose (dharma).</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">27 Nakshatras</h3>
                  <p className="text-purple-800">Lunar mansions that provide deeper psychological and spiritual insights.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Dashas (Planetary Periods)</h3>
                  <p className="text-orange-800">Time cycles that predict when specific life events will occur.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Golden Rules of Vastu</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Main entrance should be in the north, east, or northeast direction
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Kitchen should be located in the southeast corner (Agni corner)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Master bedroom should be in the southwest direction
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Pooja room or prayer area should face east or northeast
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Avoid placing toilets in the northeast corner
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  Ensure proper ventilation and natural light flow
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vedic Chart Analysis</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-bold text-gray-900">Rashi Chart (D-1)</h3>
                  <p className="text-gray-700">Main birth chart showing planetary positions and life themes</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">Navamsa Chart (D-9)</h3>
                  <p className="text-gray-700">Marriage and spiritual development chart</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-gray-900">Dasamsa Chart (D-10)</h3>
                  <p className="text-gray-700">Career and professional success analysis</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Saptamsa Chart (D-7)</h3>
                  <p className="text-gray-700">Children and progeny related predictions</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Get Authentic Vedic Astrology Reading</h3>
              <p className="mb-4">Discover your karma, dharma, and life purpose through ancient Vedic wisdom</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🕉️ Get Vedic Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Vedic;
