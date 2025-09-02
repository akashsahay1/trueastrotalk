
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Users, CheckCircle, Heart, Briefcase, Home, DollarSign, Clock, Shield, Phone, MessageCircle, Video, User, Calculator, Sparkles, Dice1, BookOpen, Eye, Hand, Building, Gem, Zap, Crown, Circle, Moon, Sun } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LazyImage from "@/components/LazyImage";
import SlidingAstrologers from "@/components/SlidingAstrologers";

const Index: React.FC = () => {
  console.log("Index component rendering...");
  
  // Initialize state at the top level
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [currentCalculatorSlide, setCurrentCalculatorSlide] = React.useState(0);

  const heroSlides = [
    {
      title: "Career and Financial Guidance",
      subtitle: "Choose your career direction and improve your financial situation. Contact for expert advice.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      stats: {
        clients: "10,000+",
        experience: "19",
        success: "99%",
        accuracy: "99%"
      },
      services: ["Birth Chart Reading", "Love & Relationship", "Career Guidance"]
    },
    {
      title: "Love & Relationship Guidance",
      subtitle: "Find your perfect match and solve relationship problems with expert astrology guidance.",
      image: "https://images.unsplash.com/photo-1494790108755-2616c9a05a1c?w=400&h=400&fit=crop&crop=face",
      stats: {
        clients: "15,000+",
        experience: "22",
        success: "97%",
        accuracy: "98%"
      },
      services: ["Marriage Compatibility", "Love Problems", "Relationship Healing"]
    },
    {
      title: "Marriage & Family Harmony",
      subtitle: "Create lasting bonds and harmonious relationships through Vedic astrology wisdom.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      stats: {
        clients: "12,500+",
        experience: "25",
        success: "96%",
        accuracy: "99%"
      },
      services: ["Kundali Matching", "Family Problems", "Marriage Timing"]
    }
  ];

  // Auto-slide functionality - ensure this runs after component mounts
  React.useEffect(() => {
    console.log("Setting up hero slide interval");
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % heroSlides.length;
        console.log("Hero slide changing from", prev, "to", next);
        return next;
      });
    }, 10000);

    return () => {
      console.log("Cleaning up hero slide interval");
      clearInterval(interval);
    };
  }, [heroSlides.length]);

  const currentSlideData = heroSlides[currentSlide];

  // Calculator Cards
  const calculatorCards = [
    {
      title: "Kundli Milan & Gun Milan",
      description: "Check marriage compatibility based on Vedic astrology principles",
      icon: Heart,
      features: ["36 Guna Matching", "Manglik Dosha Check", "Compatibility Score", "Detailed Report"],
      price: "Free",
      link: "/kundali-matching",
      registrationRequired: false
    },
    {
      title: "Love Calculator",
      description: "Discover love compatibility between partners using names and birth details",
      icon: Heart,
      features: ["Name Compatibility", "Birth Date Analysis", "Love Percentage", "Relationship Tips"],
      price: "Free",
      link: "/love-calculator",
      registrationRequired: false
    },
    {
      title: "Advanced Name Numerology",
      description: "Get detailed numerology analysis based on your name and birth date",
      icon: Calculator,
      features: ["Lucky Numbers", "Name Analysis", "Career Guidance", "Personality Traits"],
      price: "₹99",
      link: "/numerology-calculator",
      registrationRequired: false
    },
    {
      title: "Rashi Calculator",
      description: "Find your moon sign (Rashi) based on birth details",
      icon: Star,
      features: ["Moon Sign Calculation", "Rashi Characteristics", "Lucky Elements", "Predictions"],
      price: "Free",
      link: "/rashi-calculator",
      registrationRequired: false
    },
    {
      title: "Nakshatra Calculator",
      description: "Determine your birth star and its significance",
      icon: Sparkles,
      features: ["Birth Star Analysis", "Personality Traits", "Lucky Days", "Career Path"],
      price: "Free",
      link: "/nakshatra-calculator",
      registrationRequired: false
    },
    {
      title: "Panchak Calculator",
      description: "Calculate Panchak periods for auspicious timing",
      icon: Clock,
      features: ["Panchak Analysis", "Timing Guidance", "Ritual Planning", "Monthly Calendar"],
      price: "Free",
      link: "/panchak-calculator",
      registrationRequired: false
    },
    {
      title: "LoShu Grid Calculator",
      description: "Chinese numerology grid analysis for life insights",
      icon: Building,
      features: ["Life Path Analysis", "Missing Numbers", "Remedial Solutions", "Personality Mapping"],
      price: "Free",
      link: "/loshu-grid-calculator",
      registrationRequired: false
    },
    {
      title: "Signature Analysis",
      description: "Analyze your signature for personality insights",
      icon: Eye,
      features: ["Signature Upload", "Personality Analysis", "Career Guidance", "Improvement Tips"],
      price: "Free",
      link: "/signature-calculator",
      registrationRequired: false
    }
  ];

  // Auto-slide functionality for calculators
  React.useEffect(() => {
    console.log("Setting up calculator slide interval");
    const interval = setInterval(() => {
      setCurrentCalculatorSlide((prev) => {
        const itemsPerSlide = 4;
        const totalSlides = Math.ceil(calculatorCards.length / itemsPerSlide);
        const next = (prev + 1) % totalSlides;
        console.log("Calculator slide changing from", prev, "to", next);
        return next;
      });
    }, 10000);

    return () => {
      console.log("Cleaning up calculator slide interval");
      clearInterval(interval);
    };
  }, [calculatorCards.length]);

  // Zodiac Signs Data
  const zodiacSigns = [
    { name: "Aries", symbol: "🐏", dates: "Mar 21 - Apr 19", element: "Fire", gradient: "from-red-400 to-pink-400" },
    { name: "Taurus", symbol: "🐂", dates: "Apr 20 - May 20", element: "Earth", gradient: "from-green-400 to-emerald-400" },
    { name: "Gemini", symbol: "👥", dates: "May 21 - Jun 20", element: "Air", gradient: "from-yellow-400 to-orange-400" },
    { name: "Cancer", symbol: "🦀", dates: "Jun 21 - Jul 22", element: "Water", gradient: "from-blue-400 to-cyan-400" },
    { name: "Leo", symbol: "🦁", dates: "Jul 23 - Aug 22", element: "Fire", gradient: "from-orange-400 to-red-400" },
    { name: "Virgo", symbol: "👸", dates: "Aug 23 - Sep 22", element: "Earth", gradient: "from-green-400 to-teal-400" },
    { name: "Libra", symbol: "⚖️", dates: "Sep 23 - Oct 22", element: "Air", gradient: "from-pink-400 to-purple-400" },
    { name: "Scorpio", symbol: "🦂", dates: "Oct 23 - Nov 21", element: "Water", gradient: "from-red-500 to-purple-500" },
    { name: "Sagittarius", symbol: "🏹", dates: "Nov 22 - Dec 21", element: "Fire", gradient: "from-purple-400 to-indigo-400" },
    { name: "Capricorn", symbol: "🐐", dates: "Dec 22 - Jan 19", element: "Earth", gradient: "from-gray-500 to-slate-500" },
    { name: "Aquarius", symbol: "🏺", dates: "Jan 20 - Feb 18", element: "Air", gradient: "from-blue-400 to-indigo-400" },
    { name: "Pisces", symbol: "🐠", dates: "Feb 19 - Mar 20", element: "Water", gradient: "from-purple-400 to-pink-400" }
  ];

  // Nakshatras Data (27 Nakshatras)
  const nakshatras = [
    { name: "Ashwini", symbol: "🐎", lord: "Ketu", deity: "Ashwini Kumars", nature: "Divine", element: "Earth" },
    { name: "Bharani", symbol: "🌺", lord: "Venus", deity: "Yama", nature: "Human", element: "Earth" },
    { name: "Krittika", symbol: "🔥", lord: "Sun", deity: "Agni", nature: "Demon", element: "Fire" },
    { name: "Rohini", symbol: "🌹", lord: "Moon", deity: "Brahma", nature: "Human", element: "Earth" },
    { name: "Mrigashira", symbol: "🦌", lord: "Mars", deity: "Soma", nature: "Divine", element: "Earth" },
    { name: "Ardra", symbol: "💎", lord: "Rahu", deity: "Rudra", nature: "Human", element: "Water" },
    { name: "Punarvasu", symbol: "🏹", lord: "Jupiter", deity: "Aditi", nature: "Divine", element: "Water" },
    { name: "Pushya", symbol: "🌸", lord: "Saturn", deity: "Brihaspati", nature: "Divine", element: "Water" },
    { name: "Ashlesha", symbol: "🐍", lord: "Mercury", deity: "Nagas", nature: "Demon", element: "Water" },
    { name: "Magha", symbol: "👑", lord: "Ketu", deity: "Pitrs", nature: "Demon", element: "Water" },
    { name: "Purva Phalguni", symbol: "🛏️", lord: "Venus", deity: "Bhaga", nature: "Human", element: "Water" },
    { name: "Uttara Phalguni", symbol: "🌞", lord: "Sun", deity: "Aryaman", nature: "Human", element: "Fire" },
    { name: "Hasta", symbol: "✋", lord: "Moon", deity: "Savitar", nature: "Divine", element: "Fire" },
    { name: "Chitra", symbol: "💍", lord: "Mars", deity: "Vishvakarma", nature: "Demon", element: "Fire" },
    { name: "Swati", symbol: "🌿", lord: "Rahu", deity: "Vayu", nature: "Divine", element: "Fire" },
    { name: "Vishakha", symbol: "🏛️", lord: "Jupiter", deity: "Indra-Agni", nature: "Demon", element: "Fire" },
    { name: "Anuradha", symbol: "🎯", lord: "Saturn", deity: "Mitra", nature: "Divine", element: "Fire" },
    { name: "Jyeshtha", symbol: "💫", lord: "Mercury", deity: "Indra", nature: "Demon", element: "Air" },
    { name: "Mula", symbol: "🌱", lord: "Ketu", deity: "Nirriti", nature: "Demon", element: "Air" },
    { name: "Purva Ashadha", symbol: "🌊", lord: "Venus", deity: "Apas", nature: "Human", element: "Air" },
    { name: "Uttara Ashadha", symbol: "🏔️", lord: "Sun", deity: "Vishvadevas", nature: "Human", element: "Air" },
    { name: "Shravana", symbol: "👂", lord: "Moon", deity: "Vishnu", nature: "Divine", element: "Air" },
    { name: "Dhanishta", symbol: "🥁", lord: "Mars", deity: "Vasus", nature: "Demon", element: "Air" },
    { name: "Shatabhisha", symbol: "⭕", lord: "Rahu", deity: "Varuna", nature: "Demon", element: "Air" },
    { name: "Purva Bhadrapada", symbol: "⚡", lord: "Jupiter", deity: "Aja Ekapada", nature: "Human", element: "Air" },
    { name: "Uttara Bhadrapada", symbol: "🐍", lord: "Saturn", deity: "Ahir Budhnya", nature: "Human", element: "Air" },
    { name: "Revati", symbol: "🐠", lord: "Mercury", deity: "Pushan", nature: "Divine", element: "Air" }
  ];

  // Services Data
  const services = [
    {
      category: "Love & Relationships",
      icon: Heart,
      services: ["Marriage Matching", "Love Problems", "Relationship Guidance", "Breakup Solutions"],
      color: "bg-pink-100 border-pink-300"
    },
    {
      category: "Career & Business",
      icon: Briefcase,
      services: ["Career Guidance", "Business Problems", "Job Solutions", "Financial Growth"],
      color: "bg-blue-100 border-blue-300"
    },
    {
      category: "Finance & Wealth",
      icon: DollarSign,
      services: ["Money Problems", "Investment Advice", "Wealth Enhancement", "Financial Planning"],
      color: "bg-green-100 border-green-300"
    },
    {
      category: "Family & Children",
      icon: Home,
      services: ["Family Problems", "Child Issues", "Parent-Child Relations", "Fertility Solutions"],
      color: "bg-yellow-100 border-yellow-300"
    },
    {
      category: "Health & Wellness",
      icon: Shield,
      services: ["Health Issues", "Mental Peace", "Stress Relief", "Healing Remedies"],
      color: "bg-purple-100 border-purple-300"
    },
    {
      category: "Spiritual & Remedial",
      icon: Gem,
      services: ["Gemstone Advice", "Mantra Chanting", "Puja Rituals", "Vastu Consultation"],
      color: "bg-orange-100 border-orange-300"
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1877f2' }}>
      <Header />
      
      {/* Hero Section with Auto-Sliding */}
      <section className="relative min-h-screen" style={{ backgroundColor: '#1877f2' }}>
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            
            {/* Left Side Content */}
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                {currentSlideData.title.split(' ').slice(0, 2).join(' ')}<br />
                <span className="text-yellow-300">{currentSlideData.title.split(' ').slice(2).join(' ')}</span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed max-w-md">
                {currentSlideData.subtitle}
              </p>

              {/* Statistics Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {currentSlideData.stats.clients}
                </div>
                <div className="text-gray-700 font-medium mb-3">Happy Clients</div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat Now
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                </Button>
              </div>
            </div>

            {/* Right Side - Astrologer Image with Badges */}
            <div className="relative flex items-center justify-center">
              <div className="relative">
                {/* Main Astrologer Image */}
                <div className="w-80 h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl">
                  <LazyImage
                    src={currentSlideData.image}
                    alt="Expert Astrologer"
                    className="w-full h-full object-cover"
                    width={320}
                    height={320}
                  />
                </div>

                {/* Experience Badge - Top Right */}
                <div className="absolute -top-4 -right-8 bg-orange-500 text-white rounded-full px-6 py-4 shadow-lg">
                  <div className="text-3xl font-bold">{currentSlideData.stats.experience}</div>
                  <div className="text-sm font-medium">Years Experience</div>
                </div>

                {/* Success Rate Badge - Bottom Left */}
                <div className="absolute -bottom-6 -left-8 bg-green-500 text-white rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-lg">
                  <div className="text-2xl font-bold">{currentSlideData.stats.success}</div>
                  <div className="text-sm">Success</div>
                </div>
              </div>

              {/* Expert Astrologer Card - Right Side */}
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl p-6 shadow-xl max-w-xs">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 text-center">
                  EXPERT ASTROLOGER
                </div>
                
                <h3 className="text-gray-900 font-bold mb-4">Our Services</h3>
                <div className="space-y-3">
                  {currentSlideData.services.map((service, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-3xl font-bold text-orange-500">{currentSlideData.stats.accuracy}</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Zodiac Signs Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Read All Zodiac Sign's Horoscopes</h2>
            <p className="text-gray-600">Discover your daily, weekly, and monthly predictions</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {zodiacSigns.map((sign, index) => (
              <Link key={index} to={`/horoscope/${sign.name.toLowerCase()}`}>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${sign.gradient} rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg`}>
                      {sign.symbol}
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{sign.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{sign.dates}</p>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">{sign.element}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Nakshatras Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nakshatras</h2>
            <p className="text-gray-600">Discover the 27 lunar mansions and their significance in Vedic astrology</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4">
            {nakshatras.map((nakshatra, index) => (
              <Link key={index} to={index === 0 ? "/about/ashwini" : "#"}>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{nakshatra.symbol}</div>
                    <h3 className="font-bold text-purple-800 text-sm mb-1">{nakshatra.name}</h3>
                    <p className="text-xs text-gray-600 mb-1">Lord: {nakshatra.lord}</p>
                    <Badge variant="outline" className="text-xs">{nakshatra.nature}</Badge>
                    {index === 0 && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          Learn More
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Astrologers Section - Using SlidingAstrologers Component */}
      <SlidingAstrologers />

      {/* YouTube Video Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-purple-600">Learn Astrology Basics - Free Astrology Education</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the fundamentals of astrology through our comprehensive video guide. Learn about
              birth chart reading, zodiac signs, planetary influences, and how to interpret your own horoscope.
              Perfect for beginners who want to understand the ancient science of astrology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <LazyImage
                  src="https://images.unsplash.com/photo-1566837945700-30057527ade0?w=400&h=225&fit=crop"
                  alt="Astrology Basics"
                  className="w-full h-48 object-cover"
                  width={400}
                  height={225}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  10:16
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">The Complete Astrology Video Guide</h3>
                <p className="text-gray-300 text-sm mb-2">8K Video ULTRA HD</p>
                <p className="text-gray-400 text-xs">3.1M views • 4 months ago</p>
              </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <LazyImage
                  src="https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400&h=225&fit=crop"
                  alt="Vedic Astrology"
                  className="w-full h-48 object-cover"
                  width={400}
                  height={225}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  1:53:06
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">Vedic Astrology - Full Course 2025</h3>
                <p className="text-gray-300 text-sm mb-2">Astrology Academy</p>
                <p className="text-gray-400 text-xs">1.4M views • 2 weeks ago</p>
              </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden">
              <div className="relative">
                <LazyImage
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop"
                  alt="Birth Chart Reading"
                  className="w-full h-48 object-cover"
                  width={400}
                  height={225}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  45:12
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">How to Read Birth Chart - Complete Guide</h3>
                <p className="text-gray-300 text-sm mb-2">Expert Astrologer</p>
                <p className="text-gray-400 text-xs">Updated today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Expertise Areas */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Expertise Areas</h2>
            <p className="text-gray-300">
              Specialized astrologers available for different branches of astrology
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🕉️</span>
              </div>
              <h3 className="font-semibold mb-2">Vedic Astrology</h3>
              <p className="text-gray-400 text-sm mb-3">👥 25 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⭐</span>
              </div>
              <h3 className="font-semibold mb-2">Western Astrology</h3>
              <p className="text-gray-400 text-sm mb-3">👥 18 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔢</span>
              </div>
              <h3 className="font-semibold mb-2">Numerology</h3>
              <p className="text-gray-400 text-sm mb-3">👥 15 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🃏</span>
              </div>
              <h3 className="font-semibold mb-2">Tarot Reading</h3>
              <p className="text-gray-400 text-sm mb-3">👥 12 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✋</span>
              </div>
              <h3 className="font-semibold mb-2">Palmistry</h3>
              <p className="text-gray-400 text-sm mb-3">👥 10 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🏠</span>
              </div>
              <h3 className="font-semibold mb-2">Vastu Shastra</h3>
              <p className="text-gray-400 text-sm mb-3">👥 8 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">💎</span>
              </div>
              <h3 className="font-semibold mb-2">Gemstone Therapy</h3>
              <p className="text-gray-400 text-sm mb-3">👥 14 experts</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🧘</span>
              </div>
              <h3 className="font-semibold mb-2">Spiritual Healing</h3>
              <p className="text-gray-400 text-sm mb-3">👥 20 experts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Package */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Package</h2>
            <p className="text-gray-300">
              Select the perfect consultation package for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voice Call Package */}
            <div className="bg-gray-800 rounded-lg p-8 relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white text-center mb-4">Voice Call Consultation</h3>
              <p className="text-gray-300 text-center mb-6">
                Direct voice conversation with certified astrologers for immediate guidance
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">15-60 minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-yellow-400 font-bold">₹199/min</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Instant Connection</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Real-time Discussion</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Record Available</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Follow-up Notes</span>
                </div>
              </div>

              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </div>

            {/* Video Call Package - Most Popular */}
            <div className="bg-gray-800 rounded-lg p-8 relative border-2 border-yellow-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
              
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white text-center mb-4">Video Call Session</h3>
              <p className="text-gray-300 text-center mb-6">
                Face-to-face consultation with detailed chart analysis and visual explanations
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">30-90 minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-yellow-400 font-bold">₹299/min</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>HD Video Quality</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Screen Sharing</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Chart Analysis</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Personal Connection</span>
                </div>
              </div>

              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </div>

            {/* Chat Package */}
            <div className="bg-gray-800 rounded-lg p-8 relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white text-center mb-4">Chat Consultation</h3>
              <p className="text-gray-300 text-center mb-6">
                Written consultation perfect for detailed questions and documented advice
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">Text-based</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-yellow-400 font-bold">₹149/min</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Written Records</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Flexible Timing</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Detailed Responses</span>
                </div>
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Chat History</span>
                </div>
              </div>

              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Cards Section with Sliding Carousel */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Free Astrology Tools</h2>
            <p className="text-gray-300">Get instant predictions and calculations with our free tools</p>
          </div>
          
          <Carousel 
            className="w-full" 
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {calculatorCards.map((card, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                  <div className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105 h-full">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 mx-auto">
                      <card.icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-center mb-3">{card.title}</h3>
                    <p className="text-gray-300 text-center text-sm mb-4">{card.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {card.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <Star className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-2">{card.price}</div>
                      <div className="text-sm text-gray-400 mb-4">
                        {card.registrationRequired ? "Registration required" : "No registration required"}
                      </div>
                      <Link to={card.link}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Use Tool
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white" />
            <CarouselNext className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white" />
          </Carousel>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Services We Offer</h2>
            <p className="text-gray-600">Comprehensive astrological solutions for all aspects of life</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className={`${service.color} border-2 hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                      <service.icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-xl">{service.category}</h3>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {service.services.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
              <div className="text-sm">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">25,000+</div>
              <div className="text-sm">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">4.8★</div>
              <div className="text-sm">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-2">24/7</div>
              <div className="text-sm">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Professional Service?</h2>
            <p className="text-gray-600">Experience the difference with our expert astrologers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Experienced Astrologers</h3>
              <p className="text-sm text-gray-600">Certified experts with decades of experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Accurate Predictions</h3>
              <p className="text-sm text-gray-600">99% accuracy rate in our predictions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Privacy Protected</h3>
              <p className="text-sm text-gray-600">Your personal information is completely secure</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Round the clock assistance available</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
