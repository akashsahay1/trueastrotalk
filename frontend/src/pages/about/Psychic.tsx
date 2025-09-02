
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Psychic = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white mb-8 shadow-xl">
            <h1 className="text-4xl font-bold mb-4">Psychic Reading</h1>
            <p className="text-xl opacity-90">Intuitive psychic readings that tap into spiritual energies and cosmic consciousness</p>
          </div>
          
          <div className="space-y-12">
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Psychic Reading Methods</h2>
              <p className="text-gray-700 leading-relaxed text-lg text-center max-w-3xl mx-auto">
                Psychic reading involves using extrasensory perception (ESP) to gain insights into various aspects 
                of life. Our psychic readers use their intuitive abilities, spiritual connection, and psychic gifts 
                to provide guidance, predictions, and clarity about your past, present, and future situations.
              </p>
            </section>

            <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Types of Psychic Abilities</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">👁️</span>
                  </div>
                  <h3 className="font-bold text-blue-900 mb-3 text-xl text-center">Intuition</h3>
                  <p className="text-blue-800 text-center">Direct knowing and inner guidance without logical reasoning</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">🔮</span>
                  </div>
                  <h3 className="font-bold text-green-900 mb-3 text-xl text-center">Clairvoyance</h3>
                  <p className="text-green-800 text-center">Clear seeing - ability to perceive visions and images</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">🧠</span>
                  </div>
                  <h3 className="font-bold text-purple-900 mb-3 text-xl text-center">Telepathy</h3>
                  <p className="text-purple-800 text-center">Mind-to-mind communication and thought reading</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">✋</span>
                  </div>
                  <h3 className="font-bold text-orange-900 mb-3 text-xl text-center">Psychometry</h3>
                  <p className="text-orange-800 text-center">Reading energy and information from objects and places</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Psychic Reading Specializations</h2>
              <div className="space-y-6">
                <div className="border-l-8 border-violet-500 pl-6 bg-violet-50 p-6 rounded-r-xl">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">💕 Love and Relationships</h3>
                  <p className="text-gray-700 text-lg">Understanding soul connections, twin flames, and relationship dynamics</p>
                </div>
                <div className="border-l-8 border-purple-500 pl-6 bg-purple-50 p-6 rounded-r-xl">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">💼 Career and Life Purpose</h3>
                  <p className="text-gray-700 text-lg">Discovering your true calling and professional path</p>
                </div>
                <div className="border-l-8 border-blue-500 pl-6 bg-blue-50 p-6 rounded-r-xl">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">🙏 Spiritual Guidance</h3>
                  <p className="text-gray-700 text-lg">Connecting with spirit guides and higher consciousness</p>
                </div>
                <div className="border-l-8 border-pink-500 pl-6 bg-pink-50 p-6 rounded-r-xl">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">🔄 Past Life Readings</h3>
                  <p className="text-gray-700 text-lg">Understanding karmic patterns and soul's journey</p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Psychic Reading Reveals</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Hidden truths and underlying patterns in your life</span>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Guidance from spirit guides and higher realms</span>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Insights into soul connections and karmic relationships</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Clarity about life purpose and spiritual mission</span>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Future possibilities and potential outcomes</span>
                  </div>
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
                    <span className="w-4 h-4 bg-violet-500 rounded-full mr-4 flex-shrink-0"></span>
                    <span className="text-gray-700 font-medium">Healing and closure from past traumas</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Benefits of Psychic Consultation</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-violet-50 rounded-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">💚</span>
                  </div>
                  <h3 className="font-bold text-violet-900 mb-3 text-lg">Emotional Healing</h3>
                  <p className="text-gray-700">Release emotional blockages and find inner peace</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold text-purple-900 mb-3 text-lg">Decision Making</h3>
                  <p className="text-gray-700">Get clarity for important life decisions</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">✨</span>
                  </div>
                  <h3 className="font-bold text-blue-900 mb-3 text-lg">Spiritual Growth</h3>
                  <p className="text-gray-700">Accelerate your spiritual development journey</p>
                </div>
                <div className="text-center p-6 bg-pink-50 rounded-xl transform hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white text-2xl">🧭</span>
                  </div>
                  <h3 className="font-bold text-pink-900 mb-3 text-lg">Life Direction</h3>
                  <p className="text-gray-700">Find your true path and purpose in life</p>
                </div>
              </div>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 text-center text-black shadow-xl">
              <h3 className="text-3xl font-bold mb-4">Connect with Your Higher Self</h3>
              <p className="mb-6 text-lg">Get intuitive psychic readings for spiritual guidance and clarity</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                🔮 Get Psychic Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Psychic;
