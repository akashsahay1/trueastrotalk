
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RotatingTopics = () => {
  const [currentTopicIndex, setCurrentTopicIndex] = React.useState(0);

  const topics = [
    {
      title: "Career and Financial Guidance",
      description: "Choose your career direction and improve your financial situation. Contact for expert advice.",
      gradient: "from-purple-500 to-pink-500",
      stats: { clients: "10,000+", accuracy: "99%" },
      services: ["Birth Chart Reading", "Love & Relationship", "Career Guidance"]
    },
    {
      title: "Love and Relationship",
      description: "Discover your compatibility with your partner through detailed astrological analysis and birth chart matching.",
      gradient: "from-red-500 to-orange-500",
      stats: { clients: "8,500+", accuracy: "97%" },
      services: ["Compatibility Check", "Marriage Prediction", "Love Problems"]
    },
    {
      title: "Marriage Predictions",
      description: "Know about your marriage timing, partner characteristics, and marital happiness through Vedic astrology.",
      gradient: "from-indigo-500 to-purple-500",
      stats: { clients: "12,000+", accuracy: "98%" },
      services: ["Marriage Timing", "Partner Analysis", "Marital Harmony"]
    },
    {
      title: "Health Astrology",
      description: "Understand your health tendencies and potential issues through astrological analysis of your birth chart.",
      gradient: "from-yellow-500 to-orange-500",
      stats: { clients: "7,200+", accuracy: "95%" },
      services: ["Health Analysis", "Disease Prediction", "Remedial Solutions"]
    },
    {
      title: "Business and Investment",
      description: "Get business solutions and investment guidance based on astrology and numerology for success.",
      gradient: "from-green-500 to-emerald-500",
      stats: { clients: "15,000+", accuracy: "99%" },
      services: ["Business Growth", "Investment Timing", "Partnership Analysis"]
    },
    {
      title: "Education and Studies",
      description: "Find the right educational path and career guidance based on your planetary positions.",
      gradient: "from-blue-500 to-cyan-500",
      stats: { clients: "6,800+", accuracy: "96%" },
      services: ["Course Selection", "Exam Success", "Study Guidance"]
    },
    {
      title: "Property and Real Estate",
      description: "Get guidance on property buying, selling, and real estate investments through Vastu and astrology.",
      gradient: "from-teal-500 to-green-500",
      stats: { clients: "9,300+", accuracy: "94%" },
      services: ["Property Purchase", "Vastu Consultation", "Investment Advice"]
    },
    {
      title: "Legal and Court Cases",
      description: "Understand your legal matters and court case outcomes through astrological analysis.",
      gradient: "from-slate-500 to-gray-500",
      stats: { clients: "5,400+", accuracy: "93%" },
      services: ["Case Analysis", "Legal Timing", "Victory Prediction"]
    },
    {
      title: "Foreign Travel and Settlement",
      description: "Know about foreign opportunities, travel, and settlement prospects through astrology.",
      gradient: "from-violet-500 to-purple-500",
      stats: { clients: "11,200+", accuracy: "97%" },
      services: ["Travel Timing", "Settlement Analysis", "Visa Guidance"]
    },
    {
      title: "Child Birth and Pregnancy",
      description: "Get guidance about child birth timing, pregnancy, and child-related predictions.",
      gradient: "from-pink-500 to-rose-500",
      stats: { clients: "8,900+", accuracy: "98%" },
      services: ["Pregnancy Timing", "Child Analysis", "Birth Planning"]
    },
    {
      title: "Spiritual Growth and Meditation",
      description: "Connect with your inner self and find spiritual direction through meditation and astrological wisdom.",
      gradient: "from-cyan-500 to-blue-500",
      stats: { clients: "13,500+", accuracy: "99%" },
      services: ["Spiritual Guidance", "Meditation", "Inner Peace"]
    },
    {
      title: "Gemstone and Remedies",
      description: "Discover which gemstones and remedies can enhance your luck, health, and success.",
      gradient: "from-amber-500 to-yellow-500",
      stats: { clients: "14,800+", accuracy: "96%" },
      services: ["Gemstone Selection", "Remedial Measures", "Lucky Charms"]
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTopicIndex((prevIndex) => (prevIndex + 1) % topics.length);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  const currentTopic = topics[currentTopicIndex];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-purple-600 mb-4">Explore Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover various aspects of astrology and spiritual guidance that can transform your life
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className={`w-full max-w-6xl bg-gradient-to-br ${currentTopic.gradient} rounded-2xl shadow-2xl transition-all duration-1000 transform hover:scale-105 overflow-hidden`}>
            <div className="grid lg:grid-cols-2 gap-8 items-center p-8">
              {/* Left Side - Content */}
              <div className="text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">{currentTopic.title}</h1>
                <p className="text-xl mb-8 leading-relaxed">{currentTopic.description}</p>
                
                <div className="flex items-center gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{currentTopic.stats.clients}</div>
                    <div className="text-white/80">Happy Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{currentTopic.stats.accuracy}</div>
                    <div className="text-white/80">Accuracy</div>
                  </div>
                </div>
                
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                  Talk to Astrologer
                </button>
              </div>

              {/* Right Side - Astrologer Profile */}
              <div className="relative flex justify-center">
                <div className="bg-white rounded-full p-4 shadow-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face" 
                    alt="Expert Astrologer" 
                    className="w-64 h-64 rounded-full object-cover"
                  />
                  <div className="absolute -top-4 -right-4 bg-orange-500 text-white rounded-full px-4 py-2 font-bold">
                    -19% OFF
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-green-500 text-white rounded-full px-4 py-2 font-bold">
                    {currentTopic.stats.accuracy} Accuracy
                  </div>
                </div>
                
                <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-sm p-4 rounded-lg text-white">
                  <div className="text-center">
                    <div className="font-bold">EXPERT ASTROLOGER</div>
                    <div className="text-sm mt-2">Our Services</div>
                    <ul className="text-xs text-left mt-2 space-y-1">
                      {currentTopic.services.map((service, index) => (
                        <li key={index}>• {service}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Indicators */}
            <div className="flex justify-center space-x-2 pb-6">
              {topics.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTopicIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RotatingTopics;
