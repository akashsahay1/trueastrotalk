
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Pisces = () => {
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
            <h1 className="text-4xl font-bold mb-4">Pisces Horoscope</h1>
            <p className="text-xl opacity-90">Water Sign • February 19 - March 20</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Pisces</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Pisces is the twelfth and final sign of the zodiac, symbolized by two Fish swimming in opposite directions. As a water sign ruled by Neptune and Jupiter, Pisces individuals are known for their compassion, intuition, and artistic nature. They are deeply emotional and spiritually connected.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their empathy, creativity, and ability to understand others' emotions. They have a natural connection to the spiritual realm and often possess psychic abilities or strong intuitive powers.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pisces Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Compassionate and empathetic</li>
                    <li>• Intuitive and psychic</li>
                    <li>• Creative and artistic</li>
                    <li>• Spiritual and mystical</li>
                    <li>• Gentle and kind</li>
                    <li>• Adaptable and flexible</li>
                    <li>• Selfless and giving</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be overly sensitive</li>
                    <li>• May be escapist</li>
                    <li>• Sometimes naive</li>
                    <li>• Can be indecisive</li>
                    <li>• May be overly trusting</li>
                    <li>• Tendency to be moody</li>
                    <li>• Can be victimized easily</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Pisces are romantic, devoted, and deeply emotional partners. They seek soul connections and unconditional love. They are very giving in relationships and need partners who appreciate their sensitivity and creativity.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Cancer, Scorpio, Taurus, and Capricorn tend to be most compatible with Pisces.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Pisces excel in careers involving creativity, healing, or service to others. They are not naturally money-focused but can be successful when following their passion. They benefit from having financial advisors.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Arts, Music, Healing, Psychology, Spirituality, Photography, and Service professions.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Pisces should pay attention to their feet, immune system, and emotional health. They need to avoid negative environments and people. Regular meditation and spiritual practices are beneficial for their well-being.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Pisces Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🐟 Get Pisces Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Pisces;
