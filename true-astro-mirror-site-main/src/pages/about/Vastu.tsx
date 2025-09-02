
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Vastu = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Vastu About</h1>
            <p className="text-xl opacity-90">The ancient science of architecture that harmonizes living spaces with natural forces</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Vastu Shastra?</h2>
              <p className="text-gray-700 leading-relaxed">
                Vastu Shastra is the traditional Indian system of architecture that describes principles of design, 
                layout, measurements, ground preparation, space arrangement, and spatial geometry. It harmonizes 
                the five elements (earth, water, air, fire, and space) with cosmic energies to create positive 
                vibrations in living and working spaces.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Five Elements (Panchamahabhuta)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Earth (Prithvi)</h3>
                  <p className="text-blue-800">Southwest direction - represents stability, strength, and magnetic field</p>
                </div>
                <div className="bg-cyan-50 p-6 rounded-lg">
                  <h3 className="font-bold text-cyan-900 mb-2">Water (Jal)</h3>
                  <p className="text-cyan-800">Northeast direction - represents purity, clarity, and life force</p>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-2">Fire (Agni)</h3>
                  <p className="text-red-800">Southeast direction - represents energy, power, and transformation</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Air (Vayu)</h3>
                  <p className="text-green-800">Northwest direction - represents movement, circulation, and freshness</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vastu Principles for Different Spaces</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-bold text-gray-900">Residential Vastu</h3>
                  <p className="text-gray-700">Home design principles for health, prosperity, and family harmony</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Commercial Vastu</h3>
                  <p className="text-gray-700">Office and business space guidelines for success and growth</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Industrial Vastu</h3>
                  <p className="text-gray-700">Factory and manufacturing unit arrangements for productivity</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">Plot and Land Selection</h3>
                  <p className="text-gray-700">Guidelines for choosing the right plot shape, direction, and location</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vastu Benefits</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Enhanced prosperity and financial growth
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Improved health and mental peace
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Better relationships and family harmony
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Career advancement and business success
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Protection from negative energies
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Spiritual growth and positive vibrations
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Transform Your Space with Vastu</h3>
              <p className="mb-4">Get expert Vastu consultation for your home or office</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🏠 Get Vastu Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Vastu;
