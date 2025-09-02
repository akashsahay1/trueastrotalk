
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Scorpio = () => {
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
            <h1 className="text-4xl font-bold mb-4">Scorpio Horoscope</h1>
            <p className="text-xl opacity-90">Water Sign • October 23 - November 21</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Scorpio</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Scorpio is the eighth sign of the zodiac, symbolized by the Scorpion. As a water sign ruled by Pluto and Mars, Scorpio individuals are known for their intensity, passion, and mysterious nature. They are deep, transformative, and possess incredible emotional strength.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their determination, resourcefulness, and ability to see beneath the surface. They have strong intuitive powers and are drawn to the mysteries of life, often experiencing profound personal transformations.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scorpio Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Passionate and intense</li>
                    <li>• Determined and focused</li>
                    <li>• Loyal and trustworthy</li>
                    <li>• Intuitive and perceptive</li>
                    <li>• Brave and fearless</li>
                    <li>• Resourceful and strategic</li>
                    <li>• Emotionally deep</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be jealous</li>
                    <li>• May be secretive</li>
                    <li>• Sometimes manipulative</li>
                    <li>• Can hold grudges</li>
                    <li>• May be controlling</li>
                    <li>• Tendency to be suspicious</li>
                    <li>• Can be vengeful</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Scorpio are passionate, intense, and deeply committed partners. They seek soul-deep connections and complete honesty in relationships. Once they trust someone, they are incredibly loyal and protective.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Cancer, Pisces, Virgo, and Capricorn tend to be most compatible with Scorpio.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Scorpio excel in careers involving investigation, research, healing, or transformation. They are excellent at managing resources and can be very successful in finance and investments when focused.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Psychology, Investigation, Medicine, Research, Finance, Occult studies, and Transformation work.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Scorpio should pay attention to their reproductive system, bladder, and emotional health. They need outlets for their intense emotions and benefit from transformative healing practices.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Scorpio Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🦂 Get Scorpio Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Scorpio;
