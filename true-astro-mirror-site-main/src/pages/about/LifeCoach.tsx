
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const LifeCoach = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Life Coach About</h1>
            <p className="text-xl opacity-90">Spiritual guidance combined with practical life coaching</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Astrological Life Coaching Methods</h2>
              <p className="text-gray-700 leading-relaxed">
                Our life coaching approach combines ancient astrological wisdom with modern psychological 
                techniques to help you overcome challenges, achieve goals, and discover your true life purpose. 
                We integrate birth chart analysis with practical guidance for holistic personal development.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Life Coaching Areas</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Self-Discovery</h3>
                  <p className="text-blue-800">Understand your core personality, strengths, and life purpose through astrological analysis.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Goal Setting</h3>
                  <p className="text-green-800">Set realistic and achievable goals aligned with your planetary influences and life cycles.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Relationship Guidance</h3>
                  <p className="text-purple-800">Improve personal and professional relationships through compatibility insights.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Career Development</h3>
                  <p className="text-orange-800">Find your ideal career path based on your natural talents and planetary influences.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Life Enhancement Techniques</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Mindfulness and meditation practices aligned with your birth chart
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Emotional intelligence development through planetary awareness
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Stress management techniques based on your elemental nature
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Communication skills improvement through mercury placement analysis
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Financial planning aligned with your wealth-generating planetary periods
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  Health and wellness guidance through medical astrology
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Coaching Specializations</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-bold text-gray-900">Personal Transformation</h3>
                  <p className="text-gray-700">Deep inner work to align with your soul's purpose and authentic self</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900">Spiritual Awakening</h3>
                  <p className="text-gray-700">Guidance on spiritual growth and consciousness expansion</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900">Life Transitions</h3>
                  <p className="text-gray-700">Support during major life changes and planetary transitions</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900">Success Manifestation</h3>
                  <p className="text-gray-700">Practical techniques to manifest your goals using cosmic timing</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Transform Your Life Today</h3>
              <p className="mb-4">Get personalized life coaching sessions with our expert coaches</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🌟 Start Life Coaching
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LifeCoach;
