
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Cancer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Cancer Horoscope</h1>
            <p className="text-xl opacity-90">Water Sign • June 21 - July 22</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Cancer</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cancer is the fourth sign of the zodiac, symbolized by the Crab. As a water sign ruled by the Moon, Cancer individuals are known for their emotional depth, intuition, and nurturing nature. They are protective, caring, and have strong connections to home and family.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their empathy, loyalty, and strong protective instincts. They have excellent memories and are deeply connected to their past and traditions.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancer Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Highly intuitive</li>
                    <li>• Nurturing and caring</li>
                    <li>• Loyal and devoted</li>
                    <li>• Emotionally intelligent</li>
                    <li>• Protective of loved ones</li>
                    <li>• Creative and artistic</li>
                    <li>• Strong family values</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be overly emotional</li>
                    <li>• May be moody</li>
                    <li>• Sometimes clingy</li>
                    <li>• Tendency to hold grudges</li>
                    <li>• Can be pessimistic</li>
                    <li>• May avoid confrontation</li>
                    <li>• Overly sensitive at times</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Cancer are deeply emotional, nurturing, and seek security and commitment. They are incredibly loyal partners who value family and home life. They express love through care, protection, and creating a comfortable environment.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Scorpio, Pisces, Taurus, and Virgo tend to be most compatible with Cancer.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cancer excel in careers that involve caring for others, hospitality, or creative fields. They are excellent with money management and often save for security. Their intuitive nature makes them good in people-oriented professions.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Healthcare, Education, Social Work, Hospitality, Real Estate, Psychology, and Arts.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Cancer should pay attention to their stomach, chest, and emotional well-being. They need to manage stress and emotional eating. Regular exercise and emotional outlet activities are important for their health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Cancer Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🌙 Get Cancer Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Cancer;
