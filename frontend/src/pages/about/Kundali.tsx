
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Kundali = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Kundali About</h1>
            <p className="text-xl opacity-90">Your cosmic blueprint and life's roadmap</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Birth Chart Analysis</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                The birth chart or horoscope is simply a scheme or plan representing an accurate picture of heaven, planets and stars at the time of a child's birth or any particular moment for which the horoscope is being cast. This astrology chart contains 12 divisions or bhavas. These bhavas are related to our life's events at different ages. People go to an astrologer if they face any difficulty in day to day routine of life. If something goes wrong, they visit an astrologer to know the reason or nullify the bad effects present in the natal chart.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Let's understand how these 12 houses or bhavas denote different aspects of our life:
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">The 12 Houses (Bhavas) in Detail</h2>
              <div className="space-y-4">
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-bold text-red-900 mb-2">First House</h3>
                  <p className="text-red-800">It represents you or 'Self'. By the first house, a person's physical stature is analysed.</p>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                  <h3 className="font-bold text-orange-900 mb-2">Second House</h3>
                  <p className="text-orange-800">It represents accumulated wealth, finances and immediate family members of the person.</p>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="font-bold text-yellow-900 mb-2">Third House</h3>
                  <p className="text-yellow-800">It represents siblings, communication style and efforts of the native.</p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-bold text-green-900 mb-2">Fourth House</h3>
                  <p className="text-green-800">It represents happiness of the person derived through mother. It also represents home land and property or all fixed assets.</p>
                </div>
                
                <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
                  <h3 className="font-bold text-teal-900 mb-2">Fifth House</h3>
                  <p className="text-teal-800">It represents education, creativity, fun and children after marriage of the native.</p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-bold text-blue-900 mb-2">Sixth House</h3>
                  <p className="text-blue-800">It represents debt, enemy and diseases. It is also the house of competition and challenges.</p>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
                  <h3 className="font-bold text-indigo-900 mb-2">Seventh House</h3>
                  <p className="text-indigo-800">It represents your marriage and characteristics of your spouse in your birth chart.</p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-bold text-purple-900 mb-2">Eighth House</h3>
                  <p className="text-purple-800">It represents longevity, in-laws and wealth of an individual.</p>
                </div>
                
                <div className="bg-pink-50 p-6 rounded-lg border-l-4 border-pink-500">
                  <h3 className="font-bold text-pink-900 mb-2">Ninth House</h3>
                  <p className="text-pink-800">It represents the luck of the person. It also represents the religion, father and guru of the person.</p>
                </div>
                
                <div className="bg-rose-50 p-6 rounded-lg border-l-4 border-rose-500">
                  <h3 className="font-bold text-rose-900 mb-2">Tenth House</h3>
                  <p className="text-rose-800">It's a Karma bhava that represents reputation in society.</p>
                </div>
                
                <div className="bg-cyan-50 p-6 rounded-lg border-l-4 border-cyan-500">
                  <h3 className="font-bold text-cyan-900 mb-2">Eleventh House</h3>
                  <p className="text-cyan-800">This house represents the income and gain of the native during his/her life span.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-500">
                  <h3 className="font-bold text-gray-900 mb-2">Twelfth House</h3>
                  <p className="text-gray-800">It is the house of Moksha and spirituality. It is also the house of expenditure.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Importance of Kundali</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Analysing a birth chart can help you in realizing the drawbacks within you so that you can overcome that in order to achieve success.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Birth or natal chart based analysis can provide you with the information regarding your accumulated wealth, finances and inheritance.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>This zodiac chart helps you to enhance your communicative ability and the way you connect yourself through your communication to the world.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>It tells you about your fixed assets like land and property, machinery etc. It also helps you regarding your investments and their outcomes in near future.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Birth Chart provides you information about your creative ability, children after marriage.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>This astronomical birth chart proposes an insight about your hidden enemies, debt and health, how to recover from illness etc.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>It reveals information about your spouse and married life.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>This astrology chart known as the birth chart or kundli can reveal about your income and gains during this lifetime.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Evaluating a natal chart can guide you the towards path of spirituality and moksha. It also tells about your expenditure.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span>Kundli or birth chart can guide you regarding your profession and career. It also depicts your education and effects of travels on your life.</span>
                </li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion</h2>
              <p className="text-gray-700 leading-relaxed">
                In conclusion, birth chart or kundali of the person plays vital role in one's life. How and where one's life is being directed, time of events etc, these all are previously defined in chart. Understanding your birth chart empowers you to make informed decisions and navigate life's challenges with greater wisdom and clarity.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Kundali Analysis</h3>
              <p className="mb-4">Discover your life's potential with comprehensive Kundali reading</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                📊 Get Kundali Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Kundali;
