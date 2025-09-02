
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const LalKitab = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Lal Kitab About</h1>
            <p className="text-xl opacity-90">The revolutionary system of astrology with simple and effective remedies</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Lal Kitab?</h2>
              <p className="text-gray-700 leading-relaxed">
                Lal Kitab, also known as the "Red Book," is a unique system of Vedic astrology that combines 
                astrology with palmistry and provides simple, practical remedies for planetary problems. 
                Written by Pandit Roop Chand Joshi, this revolutionary approach offers immediate solutions 
                without complex rituals or expensive materials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features of Lal Kitab</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Simple Remedies</h3>
                  <p className="text-blue-800">Easy-to-follow remedies using common household items and daily activities</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">No Expensive Materials</h3>
                  <p className="text-green-800">Remedies don't require costly gemstones or elaborate rituals</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Astro-Palmistry</h3>
                  <p className="text-purple-800">Unique combination of astrology and palmistry for accurate predictions</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Instant Results</h3>
                  <p className="text-orange-800">Many remedies show positive effects within days or weeks</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Lal Kitab Remedies</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Feeding animals and birds for planetary peace
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Donating specific items on particular days
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Wearing specific colors for planetary strength
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Placing water in copper vessels for Mars
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Serving elderly people and religious places
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Avoiding certain foods during specific periods
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lal Kitab Specializations</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-gray-900">Debt and Financial Problems</h3>
                  <p className="text-gray-700">Specific remedies for overcoming financial difficulties and debts</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="font-bold text-gray-900">Marriage Delays</h3>
                  <p className="text-gray-700">Effective solutions for marriage obstacles and relationship issues</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">Career and Business</h3>
                  <p className="text-gray-700">Remedies for professional growth and business success</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Health Issues</h3>
                  <p className="text-gray-700">Simple remedies for chronic health problems and diseases</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Get Lal Kitab Solutions</h3>
              <p className="mb-4">Discover simple and effective remedies for your life problems</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                📕 Get Lal Kitab Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LalKitab;
