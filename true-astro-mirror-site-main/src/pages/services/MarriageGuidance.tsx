
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const MarriageGuidance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Marriage Guidance</h1>
            <p className="text-xl opacity-90">Expert advice for marriage and relationship compatibility</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Marriage Guidance</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Marriage is one of the most important decisions in life, and Vedic astrology provides profound insights into marital compatibility, timing, and harmony. Our expert astrologers analyze your birth chart to provide guidance on finding the right partner, understanding compatibility, and ensuring a successful married life.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Through detailed analysis of planetary positions, we help you understand the dynamics of relationships and provide remedies for a harmonious married life.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Marriage Guidance Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-pink-50 p-6 rounded-lg">
                  <h3 className="font-bold text-pink-900 mb-4">Compatibility Analysis</h3>
                  <ul className="space-y-2 text-pink-800">
                    <li>• Kundli matching (Guna Milan)</li>
                    <li>• Manglik dosha analysis</li>
                    <li>• Planetary compatibility check</li>
                    <li>• Long-term relationship prospects</li>
                  </ul>
                </div>
                
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-900 mb-4">Marriage Timing</h3>
                  <ul className="space-y-2 text-rose-800">
                    <li>• Best time for marriage</li>
                    <li>• Auspicious wedding dates</li>
                    <li>• Planetary periods analysis</li>
                    <li>• Delayed marriage solutions</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Marital Harmony</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Relationship problem solutions</li>
                    <li>• Communication improvement</li>
                    <li>• Family dispute resolution</li>
                    <li>• Love marriage guidance</li>
                  </ul>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="font-bold text-indigo-900 mb-4">Remedial Solutions</h3>
                  <ul className="space-y-2 text-indigo-800">
                    <li>• Gemstone recommendations</li>
                    <li>• Mantra and prayers</li>
                    <li>• Puja and rituals</li>
                    <li>• Vastu for married couples</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Marriage Houses in Astrology</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-blue-900">7th House - House of Marriage</h4>
                    <p className="text-blue-800">Primary house for marriage, spouse characteristics, and marital happiness.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">2nd House - Family and Support</h4>
                    <p className="text-blue-800">Represents family support, wealth after marriage, and speech in relationships.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">5th House - Love and Romance</h4>
                    <p className="text-blue-800">Indicates love affairs, romantic relationships, and children after marriage.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">8th House - Marital Longevity</h4>
                    <p className="text-blue-800">Shows the longevity of marriage, in-laws, and transformations in married life.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Marriage Problems We Address</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Delayed marriage or no marriage proposals
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Compatibility issues with potential partners
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Manglik dosha and its remedies
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Family opposition to marriage choice
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Marital discord and communication issues
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  Second marriage consultation
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Expert Marriage Guidance</h3>
              <p className="mb-4">Connect with our experienced astrologers for personalized marriage consultation</p>
              <Button className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                💕 Consult Marriage Expert
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default MarriageGuidance;
