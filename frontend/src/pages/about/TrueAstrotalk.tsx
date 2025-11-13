
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const TrueAstrotalk = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">true Astrotalk About</h1>
            <p className="text-xl opacity-90">Your trusted platform for authentic astrological guidance</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is true Astrotalk?</h2>
              <p className="text-gray-700 leading-relaxed">
                true Astrotalk is India's leading online astrology platform that connects you with experienced and verified astrologers. 
                We provide authentic astrological consultations through phone calls, chat, and video calls, making spiritual guidance 
                accessible to everyone, anywhere, anytime.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                Our mission is to preserve and promote the ancient wisdom of Vedic astrology while making it accessible to modern 
                seekers. We bridge the gap between traditional astrological knowledge and contemporary lifestyle challenges, 
                providing practical solutions for life's problems.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose true Astrotalk?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Verified Astrologers</h3>
                  <p className="text-blue-800">All our astrologers are thoroughly verified and have years of experience in their respective fields.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">24/7 Availability</h3>
                  <p className="text-green-800">Get instant access to astrological guidance anytime, anywhere with our round-the-clock service.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Multiple Languages</h3>
                  <p className="text-purple-800">Consult with astrologers in your preferred language for better understanding and comfort.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Affordable Pricing</h3>
                  <p className="text-orange-800">Quality astrological consultations at affordable prices with transparent pricing structure.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Services</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Birth Chart Analysis and Kundli Reading
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Love and Relationship Guidance
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Career and Business Consultation
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Marriage Compatibility and Timing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Health and Wellness Guidance
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Remedial Solutions and Gemstone Consultation
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Ready to Connect with Our Astrologers?</h3>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                📞 Talk to Astrologer Now
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default TrueAstrotalk;
