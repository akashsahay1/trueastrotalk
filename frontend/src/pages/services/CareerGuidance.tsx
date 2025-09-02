
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CareerGuidance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Career Guidance</h1>
            <p className="text-xl opacity-90">Find your career path based on your birth chart and planetary positions</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Career Guidance</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Your career is a significant part of your life journey, and astrology can provide valuable insights into the most suitable profession based on your planetary positions. Our expert astrologers analyze your birth chart to guide you towards a fulfilling and successful career path.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Through detailed analysis of the 10th house (house of career), planetary strengths, and dashas, we help you make informed decisions about your professional life.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Career Analysis Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-4">Career Selection</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Best suitable profession</li>
                    <li>• Industry recommendations</li>
                    <li>• Business vs job analysis</li>
                    <li>• Skills and talents identification</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Career Timing</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Job change timing</li>
                    <li>• Promotion periods</li>
                    <li>• Business startup timing</li>
                    <li>• Career growth phases</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Success Remedies</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Gemstone for career growth</li>
                    <li>• Mantras for success</li>
                    <li>• Lucky colors and directions</li>
                    <li>• Yantra recommendations</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-4">Problem Solutions</h3>
                  <ul className="space-y-2 text-orange-800">
                    <li>• Job loss remedies</li>
                    <li>• Workplace conflicts</li>
                    <li>• Career stagnation solutions</li>
                    <li>• Interview success tips</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career Houses in Astrology</h2>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-indigo-900">10th House - House of Career</h4>
                    <p className="text-indigo-800">Primary house for career, profession, reputation, and social status.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">6th House - House of Service</h4>
                    <p className="text-indigo-800">Indicates job, daily work routine, competition, and service-oriented careers.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">2nd House - House of Wealth</h4>
                    <p className="text-indigo-800">Shows earning potential, financial gains from career, and accumulated wealth.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">11th House - House of Gains</h4>
                    <p className="text-indigo-800">Represents income, profits, achievements, and fulfillment of career goals.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career Fields Based on Planets</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-900 mb-2">Sun Careers</h4>
                  <p className="text-yellow-800 text-sm">Government, Politics, Administration, Leadership roles</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Moon Careers</h4>
                  <p className="text-blue-800 text-sm">Healthcare, Hospitality, Water-related, Public service</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-red-900 mb-2">Mars Careers</h4>
                  <p className="text-red-800 text-sm">Military, Sports, Engineering, Real Estate</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-900 mb-2">Mercury Careers</h4>
                  <p className="text-green-800 text-sm">Communication, Writing, IT, Trading, Education</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-900 mb-2">Jupiter Careers</h4>
                  <p className="text-purple-800 text-sm">Teaching, Law, Finance, Spirituality, Consulting</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-bold text-pink-900 mb-2">Venus Careers</h4>
                  <p className="text-pink-800 text-sm">Arts, Fashion, Beauty, Entertainment, Luxury goods</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Professional Career Guidance</h3>
              <p className="mb-4">Discover your ideal career path through astrological analysis</p>
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🎯 Get Career Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default CareerGuidance;
