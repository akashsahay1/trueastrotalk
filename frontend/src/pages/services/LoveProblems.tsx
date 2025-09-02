
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const LoveProblems = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Love Problems Solution</h1>
            <p className="text-xl opacity-90">Get solutions for your love and relationship problems</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Love Problem Solutions</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Love is the most beautiful emotion, but sometimes relationships face challenges that seem impossible to overcome. Our expert astrologers provide effective solutions for all types of love problems using ancient Vedic astrology principles and proven remedies.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're facing issues in getting your love back, convincing parents, or resolving conflicts with your partner, we have the right astrological solutions for you.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Love Problem Solutions We Provide</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Getting Love Back</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Ex-boyfriend/girlfriend return</li>
                    <li>• Broken relationship healing</li>
                    <li>• Lost love recovery</li>
                    <li>• Reconciliation remedies</li>
                  </ul>
                </div>
                
                <div className="bg-pink-50 p-6 rounded-lg">
                  <h3 className="font-bold text-pink-900 mb-4">Family Approval</h3>
                  <ul className="space-y-2 text-pink-800">
                    <li>• Parents convincing solutions</li>
                    <li>• Inter-caste marriage approval</li>
                    <li>• Family opposition removal</li>
                    <li>• Love marriage success</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Relationship Issues</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Communication problems</li>
                    <li>• Trust issues resolution</li>
                    <li>• Jealousy and possessiveness</li>
                    <li>• Third person interference</li>
                  </ul>
                </div>
                
                <div className="bg-rose-50 p-6 rounded-lg">
                  <h3 className="font-bold text-rose-900 mb-4">Love Attraction</h3>
                  <ul className="space-y-2 text-rose-800">
                    <li>• Attract desired person</li>
                    <li>• One-sided love solutions</li>
                    <li>• Vashikaran mantras</li>
                    <li>• Love spell remedies</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Planets Affecting Love Life</h2>
              <div className="bg-pink-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-pink-900">Venus - Planet of Love</h4>
                    <p className="text-pink-800">Main planet governing love, romance, attraction, and relationship harmony.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-900">Moon - Emotional Connection</h4>
                    <p className="text-pink-800">Represents emotions, feelings, and emotional bonding in relationships.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-900">Mars - Passion and Desire</h4>
                    <p className="text-pink-800">Indicates physical attraction, passion, and intensity in love relationships.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-900">7th House - Relationships</h4>
                    <p className="text-pink-800">Primary house for partnerships, marriage, and long-term relationships.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Love Problems We Solve</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Breakup and separation issues
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  One-sided love problems
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Family opposition to love marriage
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Long-distance relationship challenges
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Cheating and infidelity issues
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Love triangle complications
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Solve Your Love Problems Today</h3>
              <p className="mb-4">Get expert guidance and proven remedies for all your love issues</p>
              <Button className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                💖 Get Love Problem Solution
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LoveProblems;
