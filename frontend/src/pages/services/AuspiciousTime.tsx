
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const AuspiciousTime = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Auspicious Time (Muhurat)</h1>
            <p className="text-xl opacity-90">Find the best time for important events and ceremonies</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Auspicious Time (Muhurat)</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Muhurat is the most auspicious time to begin any important work or ceremony according to Vedic astrology. Choosing the right muhurat ensures success, prosperity, and positive outcomes for your endeavors. Our expert astrologers calculate the most favorable time based on planetary positions and cosmic energies.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Every important activity in life, from marriage to business ventures, should be started at an auspicious time to harness the maximum positive cosmic energy and avoid obstacles.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Muhurat Services We Provide</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="font-bold text-indigo-900 mb-4">Wedding Muhurat</h3>
                  <ul className="space-y-2 text-indigo-800">
                    <li>• Marriage ceremony timing</li>
                    <li>• Engagement ceremony</li>
                    <li>• Ring ceremony muhurat</li>
                    <li>• Wedding rituals timing</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Business Muhurat</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Business opening ceremony</li>
                    <li>• Shop inauguration</li>
                    <li>• Office shifting</li>
                    <li>• Partnership agreements</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-4">Property Muhurat</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• House warming ceremony</li>
                    <li>• Property purchase</li>
                    <li>• Construction start</li>
                    <li>• Foundation laying</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Personal Muhurat</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Vehicle purchase</li>
                    <li>• Travel timing</li>
                    <li>• Education admission</li>
                    <li>• Job joining</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Factors Considered for Muhurat</h2>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-purple-900">Tithi (Lunar Day)</h4>
                    <p className="text-purple-800">The lunar day phase which influences the success of activities.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Nakshatra (Constellation)</h4>
                    <p className="text-purple-800">The star constellation governing the cosmic energy at that time.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Yoga (Planetary Combination)</h4>
                    <p className="text-purple-800">Favorable planetary combinations for specific activities.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900">Karana (Half Lunar Day)</h4>
                    <p className="text-purple-800">Half of a tithi which provides additional timing precision.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Auspicious and Inauspicious Times</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Auspicious Times</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Abhijit Muhurat (midday)</li>
                    <li>• Brahma Muhurat (early morning)</li>
                    <li>• Godhuli Muhurat (sunset)</li>
                    <li>• Amrit Kaal (nectar time)</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Times to Avoid</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Rahu Kaal (Rahu period)</li>
                    <li>• Yamaganda Kaal</li>
                    <li>• Gulika Kaal</li>
                    <li>• Eclipse periods</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Special Occasions We Cover</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Marriage and wedding ceremonies
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Naming ceremony of children
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Thread ceremony (Upanayana)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  House warming and shifting
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Business and shop opening
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Vehicle purchase and registration
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Find Your Perfect Muhurat</h3>
              <p className="mb-4">Get personalized auspicious timing for your important events</p>
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                ⏰ Get Muhurat Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AuspiciousTime;
