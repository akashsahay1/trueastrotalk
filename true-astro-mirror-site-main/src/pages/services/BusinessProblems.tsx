
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const BusinessProblems = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Business Problems Solution</h1>
            <p className="text-xl opacity-90">Get business solutions based on astrology and numerology</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Business Problem Solutions</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Running a successful business requires more than just hard work and strategy. Astrological factors play a significant role in business success, partnerships, timing of ventures, and overcoming obstacles. Our expert astrologers provide comprehensive business guidance using Vedic astrology principles.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're starting a new business, facing partnership issues, or looking to expand, we analyze your birth chart and provide strategic guidance for business growth and prosperity.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Consultation Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-6 rounded-lg">
                  <h3 className="font-bold text-amber-900 mb-4">Business Planning</h3>
                  <ul className="space-y-2 text-amber-800">
                    <li>• Best business selection</li>
                    <li>• Startup timing analysis</li>
                    <li>• Location and direction guidance</li>
                    <li>• Business name numerology</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-4">Partnership Analysis</h3>
                  <ul className="space-y-2 text-orange-800">
                    <li>• Partner compatibility check</li>
                    <li>• Joint venture timing</li>
                    <li>• Partnership agreements</li>
                    <li>• Conflict resolution</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="font-bold text-yellow-900 mb-4">Growth Strategies</h3>
                  <ul className="space-y-2 text-yellow-800">
                    <li>• Expansion timing</li>
                    <li>• New market entry</li>
                    <li>• Product launch guidance</li>
                    <li>• Investment opportunities</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Problem Solutions</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Loss recovery remedies</li>
                    <li>• Competition handling</li>
                    <li>• Legal issue solutions</li>
                    <li>• Staff and employee issues</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Houses in Astrology</h2>
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-orange-900">10th House - Business Success</h4>
                    <p className="text-orange-800">Primary house for profession, business reputation, and success in trade.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">7th House - Partnerships</h4>
                    <p className="text-orange-800">Governs business partnerships, joint ventures, and customer relations.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">11th House - Profits</h4>
                    <p className="text-orange-800">Represents business profits, gains, and fulfillment of business goals.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">2nd House - Business Wealth</h4>
                    <p className="text-orange-800">Shows accumulated wealth from business and financial stability.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Business-Friendly Planets</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-900 mb-2">Mercury</h4>
                  <p className="text-green-800 text-sm">Planet of trade, business, communication, and commerce.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Jupiter</h4>
                  <p className="text-blue-800 text-sm">Brings wisdom, expansion, and ethical business practices.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-900 mb-2">Venus</h4>
                  <p className="text-purple-800 text-sm">Enhances luxury business, arts, and customer satisfaction.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Business Problems We Solve</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Continuous business losses
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Partnership disputes and conflicts
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Cash flow and payment delays
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Competition and market challenges
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Legal and regulatory issues
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Employee and staff problems
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Transform Your Business Today</h3>
              <p className="mb-4">Get expert business guidance and solutions through astrology</p>
              <Button className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                📈 Get Business Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default BusinessProblems;
