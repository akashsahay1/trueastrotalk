
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Capricorn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Capricorn Horoscope</h1>
            <p className="text-xl opacity-90">Earth Sign • December 22 - January 19</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Capricorn</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Capricorn is the tenth sign of the zodiac, symbolized by the Mountain Goat. As an earth sign ruled by Saturn, Capricorn individuals are known for their ambition, discipline, and practical approach to life. They are natural achievers who work steadily toward their goals.
              </p>
              <p className="text-gray-700 leading-relaxed">
                People born under this sign are characterized by their responsibility, patience, and strong work ethic. They have a natural ability to organize, manage, and build lasting structures in both their personal and professional lives.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Capricorn Personality Traits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Positive Traits</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Ambitious and goal-oriented</li>
                    <li>• Disciplined and organized</li>
                    <li>• Responsible and reliable</li>
                    <li>• Patient and persistent</li>
                    <li>• Practical and realistic</li>
                    <li>• Traditional and stable</li>
                    <li>• Leadership qualities</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-900 mb-4">Areas for Growth</h3>
                  <ul className="space-y-2 text-red-800">
                    <li>• Can be pessimistic</li>
                    <li>• May be too serious</li>
                    <li>• Sometimes rigid</li>
                    <li>• Can be materialistic</li>
                    <li>• May be unforgiving</li>
                    <li>• Tendency to be workaholic</li>
                    <li>• Can be status-conscious</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Love & Relationships</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In love, Capricorn are loyal, committed, and seek long-term stability. They may be slow to open up but are very devoted partners once committed. They express love through acts of service and providing security.
              </p>
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-bold text-pink-900 mb-2">Compatible Signs</h3>
                <p className="text-pink-800">Taurus, Virgo, Scorpio, and Pisces tend to be most compatible with Capricorn.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Career & Finance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Capricorn excel in careers involving management, business, finance, or government. They are excellent at building wealth and managing resources. They prefer traditional, established career paths.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Ideal Career Paths</h3>
                <p className="text-blue-800">Management, Finance, Government, Engineering, Architecture, Administration, and Traditional professions.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health & Wellness</h2>
              <p className="text-gray-700 leading-relaxed">
                Capricorn should pay attention to their bones, joints, and skin. They need to balance work with rest and relaxation. Stress from overwork can affect their health.
              </p>
            </section>
            
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Detailed Capricorn Reading</h3>
              <p className="mb-4">Discover what the stars have in store for you today and beyond</p>
              <Button className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🐐 Get Capricorn Horoscope
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Capricorn;
