
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const KP = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">KP About</h1>
            <p className="text-xl opacity-90">Krishnamurti Paddhati - A precise and scientific method of astrological prediction</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is KP Astrology?</h2>
              <p className="text-gray-700 leading-relaxed">
                KP Astrology, also known as Krishnamurti Paddhati, is a system of astrology developed by late 
                Prof. K.S. Krishnamurti. It's known for its accuracy in predictions and uses a unique system 
                of sub-divisions of zodiac signs called "Sub Lords" which provides precise timing of events 
                and clear yes/no answers to specific questions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features of KP System</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Sub Lord Theory</h3>
                  <p className="text-blue-800">Each planet, sign, and house has a sub lord that determines the final result</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Placidus House System</h3>
                  <p className="text-green-800">Uses unequal house divisions for more accurate predictions</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Ruling Planets</h3>
                  <p className="text-purple-800">System of ruling planets for precise event timing</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Horary Astrology</h3>
                  <p className="text-orange-800">Answer specific questions through horary charts</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">KP Specializations</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-teal-500 pl-4">
                  <h3 className="font-bold text-gray-900">Precise Event Timing</h3>
                  <p className="text-gray-700">Exact timing of marriage, job changes, and major life events</p>
                </div>
                <div className="border-l-4 border-cyan-500 pl-4">
                  <h3 className="font-bold text-gray-900">Yes/No Predictions</h3>
                  <p className="text-gray-700">Clear answers to specific questions about future outcomes</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Medical Astrology</h3>
                  <p className="text-gray-700">Precise diagnosis and timing of health issues and recovery</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Business Predictions</h3>
                  <p className="text-gray-700">Accurate business timing and partnership analysis</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Advantages of KP System</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  More accurate than traditional Vedic astrology methods
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Precise timing of events down to days and hours
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Clear yes/no answers to specific questions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Scientific approach with logical explanations
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Eliminates contradictions found in traditional methods
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Suitable for horary and event-specific predictions
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">KP Applications</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center p-4">
                  <h3 className="font-bold text-teal-900 mb-2">Career Guidance</h3>
                  <p className="text-gray-700">Precise timing for job changes and promotions</p>
                </div>
                <div className="text-center p-4">
                  <h3 className="font-bold text-cyan-900 mb-2">Marriage Timing</h3>
                  <p className="text-gray-700">Exact periods for marriage and relationship events</p>
                </div>
                <div className="text-center p-4">
                  <h3 className="font-bold text-blue-900 mb-2">Health Analysis</h3>
                  <p className="text-gray-700">Timing of health issues and recovery periods</p>
                </div>
                <div className="text-center p-4">
                  <h3 className="font-bold text-purple-900 mb-2">Financial Predictions</h3>
                  <p className="text-gray-700">Investment timing and financial gain periods</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Get Precise KP Predictions</h3>
              <p className="mb-4">Experience the accuracy of Krishnamurti Paddhati astrology</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🎯 Get KP Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default KP;
