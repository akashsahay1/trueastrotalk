
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
import astrologerImage from "@/assets/images/astrologer.jpeg";


const Index: React.FC = () => {
  console.log("Index component rendering...");

  // Initialize state at the top level
  const [currentCalculatorSlide, setCurrentCalculatorSlide] = React.useState(0);
  const [lifePathApi, setLifePathApi] = React.useState<any>(null);
  const [nakshatraApi, setNakshatraApi] = React.useState<any>(null);
  const [calculatorApi, setCalculatorApi] = React.useState<any>(null);

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

  // Auto-slide functionality for Life Path Numbers - every 2 seconds
  React.useEffect(() => {
    if (!lifePathApi) return;

    const interval = setInterval(() => {
      lifePathApi?.scrollNext();
    }, 2000);

    return () => clearInterval(interval);
  }, [lifePathApi]);

  // Auto-slide functionality for Nakshatras - every 4 seconds (slower)
  React.useEffect(() => {
    if (!nakshatraApi) return;

    const interval = setInterval(() => {
      nakshatraApi?.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [nakshatraApi]);

  // Auto-slide functionality for Free Astrology Tools - every 5 seconds
  React.useEffect(() => {
    if (!calculatorApi) return;

    const interval = setInterval(() => {
      calculatorApi?.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [calculatorApi]);

  // Life Path Numbers Data (1-31)
  const lifePathNumbers = Array.from({ length: 31 }, (_, i) => {
    const number = i + 1;
    const titles = [
      "The Leader", "The Peacemaker", "The Creator", "The Builder", "The Freedom Seeker",
      "The Nurturer", "The Seeker", "The Powerhouse", "The Humanitarian", "The Innovator",
      "The Inspirer", "The Analyst", "The Visionary", "The Freedom", "The Healer",
      "The Awakening", "The Star", "The Manifester", "The Teacher", "The Awakener",
      "The Intuitive", "The Master Builder", "The Compassionate", "The Warrior", "The Adventure",
      "The Diplomat", "The Idealist", "The Abundance", "The Spiritual", "The Expression",
      "The Master Teacher"
    ];

    const descriptions = [
      "Represents leadership, independence, and new beginnings",
      "Symbolizes harmony, cooperation, and balance in relationships",
      "Embodies creativity, self-expression, and joyful communication",
      "Signifies stability, practicality, and strong foundations",
      "Represents change, versatility, and freedom of expression",
      "Symbolizes love, nurturing, and responsibility towards family",
      "Embodies spiritual wisdom, introspection, and inner knowledge",
      "Signifies material success, authority, and abundance",
      "Represents compassion, completion, and humanitarian service",
      "Symbolizes innovation, leadership, and pioneering spirit",
      "Embodies inspiration, optimism, and spiritual enlightenment",
      "Represents analytical thinking, harmony, and mediation",
      "Signifies vision, imagination, and creative manifestation",
      "Symbolizes freedom, exploration, and personal liberty",
      "Embodies healing abilities, nurturing, and emotional depth",
      "Represents spiritual awakening and higher consciousness",
      "Signifies hope, inspiration, and spiritual guidance",
      "Symbolizes material mastery and powerful manifestation",
      "Embodies wisdom, teaching, and humanitarian leadership",
      "Represents awakening consciousness and inner transformation",
      "Signifies intuition, sensitivity, and psychic abilities",
      "Symbolizes master building and large-scale manifestation",
      "Embodies compassion, service, and universal love",
      "Represents courage, determination, and warrior spirit",
      "Signifies adventure, curiosity, and life experience",
      "Symbolizes diplomacy, cooperation, and peaceful resolution",
      "Embodies idealism, vision, and spiritual purpose",
      "Represents material abundance and prosperity",
      "Signifies spiritual mastery and enlightenment",
      "Symbolizes self-expression, creativity, and communication",
      "Embodies master teaching and spiritual leadership"
    ];

    return {
      number,
      title: `Life Path Number ${number}: ${titles[i]}`,
      description: descriptions[i],
      views: Math.floor(Math.random() * 3000) + 1000,
      date: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  });

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
    { name: "Ashwini", symbol: "🐎", lord: "Ketu", deity: "Ashwini Kumars", nature: "Divine", element: "Earth", path: "/about/ashwini" },
    { name: "Bharani", symbol: "🌺", lord: "Venus", deity: "Yama", nature: "Human", element: "Earth", path: "/about/bharani" },
    { name: "Krittika", symbol: "🔥", lord: "Sun", deity: "Agni", nature: "Demon", element: "Fire", path: "/about/krittika" },
    { name: "Rohini", symbol: "🌹", lord: "Moon", deity: "Brahma", nature: "Human", element: "Earth", path: "/about/rohini" },
    { name: "Mrigashira", symbol: "🦌", lord: "Mars", deity: "Soma", nature: "Divine", element: "Earth", path: "/about/mrigashira" },
    { name: "Ardra", symbol: "💎", lord: "Rahu", deity: "Rudra", nature: "Human", element: "Water", path: "/about/ardra" },
    { name: "Punarvasu", symbol: "🏹", lord: "Jupiter", deity: "Aditi", nature: "Divine", element: "Water", path: "/about/punarvasu" },
    { name: "Pushya", symbol: "🌸", lord: "Saturn", deity: "Brihaspati", nature: "Divine", element: "Water", path: "/about/pushya" },
    { name: "Ashlesha", symbol: "🐍", lord: "Mercury", deity: "Nagas", nature: "Demon", element: "Water", path: "/about/ashlesha" },
    { name: "Magha", symbol: "👑", lord: "Ketu", deity: "Pitrs", nature: "Demon", element: "Water", path: "/about/magha" },
    { name: "Purva Phalguni", symbol: "🛏️", lord: "Venus", deity: "Bhaga", nature: "Human", element: "Water", path: "/about/purva-phalguni" },
    { name: "Uttara Phalguni", symbol: "🌞", lord: "Sun", deity: "Aryaman", nature: "Human", element: "Fire", path: "/about/uttara-phalguni" },
    { name: "Hasta", symbol: "✋", lord: "Moon", deity: "Savitar", nature: "Divine", element: "Fire", path: "/about/hasta" },
    { name: "Chitra", symbol: "💍", lord: "Mars", deity: "Vishvakarma", nature: "Demon", element: "Fire", path: "/about/chitra" },
    { name: "Swati", symbol: "🌿", lord: "Rahu", deity: "Vayu", nature: "Divine", element: "Fire", path: "/about/swati" },
    { name: "Vishakha", symbol: "🏛️", lord: "Jupiter", deity: "Indra-Agni", nature: "Demon", element: "Fire", path: "/about/vishakha" },
    { name: "Anuradha", symbol: "🎯", lord: "Saturn", deity: "Mitra", nature: "Divine", element: "Fire", path: "/about/anuradha" },
    { name: "Jyeshtha", symbol: "💫", lord: "Mercury", deity: "Indra", nature: "Demon", element: "Air", path: "/about/jyeshtha" },
    { name: "Mula", symbol: "🌱", lord: "Ketu", deity: "Nirriti", nature: "Demon", element: "Air", path: "/about/mula" },
    { name: "Purva Ashadha", symbol: "🌊", lord: "Venus", deity: "Apas", nature: "Human", element: "Air", path: "/about/purva-ashadha" },
    { name: "Uttara Ashadha", symbol: "🏔️", lord: "Sun", deity: "Vishvadevas", nature: "Human", element: "Air", path: "/about/uttara-ashadha" },
    { name: "Shravana", symbol: "👂", lord: "Moon", deity: "Vishnu", nature: "Divine", element: "Air", path: "/about/shravana" },
    { name: "Dhanishta", symbol: "🥁", lord: "Mars", deity: "Vasus", nature: "Demon", element: "Air", path: "/about/dhanishta" },
    { name: "Shatabhisha", symbol: "⭕", lord: "Rahu", deity: "Varuna", nature: "Demon", element: "Air", path: "/about/shatabhisha" },
    { name: "Purva Bhadrapada", symbol: "⚡", lord: "Jupiter", deity: "Aja Ekapada", nature: "Human", element: "Air", path: "/about/purva-bhadrapada" },
    { name: "Uttara Bhadrapada", symbol: "🐍", lord: "Saturn", deity: "Ahir Budhnya", nature: "Human", element: "Air", path: "/about/uttara-bhadrapada" },
    { name: "Revati", symbol: "🐠", lord: "Mercury", deity: "Pushan", nature: "Divine", element: "Air", path: "/about/revati" }
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Call With Astrologer */}
      <section className="relative bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="relative max-w-6xl mx-auto">

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-400 rounded-full opacity-60 hidden lg:block"></div>
            <div className="absolute top-32 right-20 w-6 h-6 bg-yellow-300 rounded-full opacity-50 hidden lg:block"></div>
            <div className="absolute bottom-20 left-32 w-10 h-10 bg-yellow-400 rounded-full opacity-40 hidden lg:block"></div>
            <div className="absolute bottom-40 right-40 w-12 h-12 bg-yellow-300 rounded-full opacity-50 hidden lg:block"></div>

            {/* Central Container */}
            <div className="relative lg:min-h-[600px] flex items-center justify-center">

              {/* Service Cards - Orbital Layout (Desktop Only) */}
              <div className="hidden xl:block absolute w-full h-full">

                {/* Business - Top Left */}
                <div className="absolute top-0 left-10 w-72 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
                      <p className="text-gray-600 text-sm">Plan profitable ventures and expand your business with astrological insights.</p>
                    </div>
                  </div>
                </div>

                {/* Finance - Left */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-80 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Finance</h3>
                      <p className="text-gray-600 text-sm">Achieve financial stability and prosperity through powerful astrological insights.</p>
                    </div>
                  </div>
                </div>

                {/* Health - Bottom Left */}
                <div className="absolute bottom-0 left-10 w-72 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Health</h3>
                      <p className="text-gray-600 text-sm">Maintain balance, energy, and well-being with the support of Vedic astrology insights.</p>
                    </div>
                  </div>
                </div>

                {/* Marriage - Top Right */}
                <div className="absolute top-0 right-10 w-72 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Marriage</h3>
                      <p className="text-gray-600 text-sm">Create lasting bonds and harmonious relationships with divine guidance.</p>
                    </div>
                  </div>
                </div>

                {/* Love - Right */}
                <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-80 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Love</h3>
                      <p className="text-gray-600 text-sm">Discover true connection and emotional fulfillment with guidance from Vedic astrology.</p>
                    </div>
                  </div>
                </div>

                {/* Career - Bottom Right */}
                <div className="absolute bottom-0 right-10 w-72 bg-white border-2 border-yellow-400 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Career</h3>
                      <p className="text-gray-600 text-sm">Shape a successful and fulfilling career path with astrological wisdom.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Section */}
              <div className="relative z-10 text-center">

                {/* Central Astrologer Image */}
                <div className="mb-8 inline-block">
                  <div className="relative">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 p-4 shadow-2xl">
                      <img
                        src={astrologerImage}
                        alt="Expert Astrologer"
                        className="w-full h-full rounded-full object-cover"
                        style={{ objectPosition: 'top' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
                  Call With <span className="text-yellow-600">Astrologer</span>
                </h1>

                {/* Call Now Button */}
                <Button
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl font-bold rounded-full shadow-xl"
                >
                  <Phone className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                  CALL NOW
                </Button>
              </div>
            </div>

            {/* Service Cards Grid (Mobile/Tablet Only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 xl:hidden">
              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Business</h3>
                    <p className="text-gray-600 text-sm">Plan profitable ventures and expand your business with astrological insights.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Finance</h3>
                    <p className="text-gray-600 text-sm">Achieve financial stability and prosperity through powerful astrological insights.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Health</h3>
                    <p className="text-gray-600 text-sm">Maintain balance, energy, and well-being with the support of Vedic astrology insights.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Marriage</h3>
                    <p className="text-gray-600 text-sm">Create lasting bonds and harmonious relationships with divine guidance.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Love</h3>
                    <p className="text-gray-600 text-sm">Discover true connection and emotional fulfillment with guidance from Vedic astrology.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Career</h3>
                    <p className="text-gray-600 text-sm">Shape a successful and fulfilling career path with astrological wisdom.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Life Path Numbers Section (1-31) */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Numerology Life Path Numbers 1–31</h2>
            <p className="text-gray-600 text-lg">Discover the hidden meanings behind life path numbers and unlock the secrets of numerology, karma, and spirituality.</p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            setApi={setLifePathApi}
          >
            <CarouselContent className="-ml-4">
              {lifePathNumbers.map((item) => (
                <CarouselItem key={item.number} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Link to={`/life-path-number/${item.number}`} className="block h-full">
                    <Card className="h-full bg-slate-800 border-slate-700 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group cursor-pointer">
                      <CardContent className="p-6 relative">
                        {/* Astrologer Badge */}
                        <Badge className="absolute top-4 left-4 bg-yellow-500 text-slate-900 font-semibold px-3 py-1">
                          astrologer
                        </Badge>

                        {/* Heart Icon */}
                        <button
                          className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors z-10"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Heart className="w-5 h-5" />
                        </button>

                        {/* Number Display */}
                        <div className="flex items-center justify-center my-8">
                          <div className="relative">
                            <div className="w-32 h-40 bg-gradient-to-b from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center shadow-xl">
                              <span className="text-6xl font-bold text-white">{item.number}</span>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {item.description}
                        </p>

                        {/* Footer Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-slate-700">
                          {/* <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.views}</span>
                          </div> */}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-12" />
            <CarouselNext className="right-0 translate-x-12" />
          </Carousel>
        </div>
      </section>

      {/* Zodiac Signs Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Read All Zodiac Sign's Horoscopes</h2>
            <p className="text-muted-foreground">Discover your daily, weekly, and monthly predictions</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {zodiacSigns.map((sign, index) => (
              <Link key={index} to={`/horoscope/${sign.name.toLowerCase()}`}>
                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${sign.gradient} rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg`}>
                      {sign.symbol}
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{sign.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{sign.dates}</p>
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">{sign.element}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Nakshatras Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Nakshatras</h2>
            <Link to="/about/nakshatras" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Discover the 27 lunar mansions and their significance in Vedic astrology
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            setApi={setNakshatraApi}
          >
            <CarouselContent className="-ml-4">
              {nakshatras.map((nakshatra, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/3 lg:basis-1/5">
                  <Link to={nakshatra.path}>
                    <Card className="text-center p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 hover:border-primary">
                      <CardContent className="p-4">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">{nakshatra.symbol}</span>
                        </div>
                        <h3 className="font-semibold text-primary mb-1">{nakshatra.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">Lord: {nakshatra.lord}</p>
                        <p className="text-xs text-muted-foreground">{nakshatra.nature}</p>
                        <div className="mt-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Learn More
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-12" />
            <CarouselNext className="right-0 translate-x-12" />
          </Carousel>
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
                  <span className="text-yellow-400 font-bold">₹8/min</span>
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

              {/* <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button> */}
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
                  <span className="text-yellow-400 font-bold">₹12/min</span>
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

              {/* <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button> */}
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
                  <span className="text-yellow-400 font-bold">₹3/min</span>
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

              {/* <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Clock className="w-4 h-4 mr-2" />
                Book Now
              </Button> */}
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
            setApi={setCalculatorApi}
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
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Services We Offer</h2>
            <p className="text-muted-foreground">Comprehensive astrological solutions for all aspects of life</p>
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

                  {/* <div className="space-y-2">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">250+</div>
              <div className="text-sm">Certified Astrologers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">4.8⭐</div>
              <div className="text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-2">24/7</div>
              <div className="text-sm">Available Support</div>
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

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-12">
            {/* Main Heading */}
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">🌟 Astrology by true Astrotalk</h2>
            </div>

            {/* Introduction */}
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                At true Astrotalk, we believe that astrology is not merely a science of prediction — it is a sacred pathway to self-realization and cosmic harmony. Rooted in the profound wisdom of ancient Vedic astrology, our philosophy transcends the boundaries of conventional forecasts. We explore how celestial rhythms, planetary alignments, and divine cosmic energies influence every dimension of human existence — shaping your destiny, emotions, and evolution.
              </p>
              <p>
                Every soul carries a distinct celestial signature, and through astrology, we decode that unique imprint. Your Kundli (birth chart) is more than a diagram of planets — it is your cosmic DNA, revealing your innate strengths, karmic patterns, and life's hidden possibilities. It is your divine compass, guiding you toward a life that resonates with your higher self and true purpose.
              </p>
              <p>
                At true Astrotalk, we merge timeless Vedic knowledge with contemporary insight to deliver astrology that is not just predictive but transformative. Our goal is to empower you with authentic, meaningful, and actionable guidance — whether you're seeking direction in love, career, finance, health, education, or spirituality.
              </p>
            </div>

            {/* Beyond Predictions Section */}
            <div className="border-t pt-12">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">🔮 Beyond Predictions — The True Meaning of Astrology</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Astrology is often misunderstood as mere fortune-telling, but at true Astrotalk, we go far beyond simple astrology predictions. We view astrology as a divine science of awareness, a key to understanding one's personality, purpose, and potential.
                </p>
                <p>
                  Every celestial body in your horoscope holds a profound symbolic influence — the Moon governs your emotions and intuition, Mars drives your courage and ambition, while Venus defines love, beauty, and connection. When you understand how these cosmic energies shape your life, you gain the power to make enlightened choices, overcome challenges gracefully, and harness the right opportunities at the right time.
                </p>
                <p className="font-semibold text-gray-900">Our astrology readings are deeply personalized and address your specific life questions, such as:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li>💞 When is the most auspicious time to begin a relationship or get married?</li>
                  <li>💼 How can you elevate your career, attract prosperity, or expand your business?</li>
                  <li>🌿 Can astrology reveal remedies for ongoing health or emotional challenges?</li>
                </ul>
                <p>
                  At true Astrotalk, every consultation is a journey of insight and empowerment — guiding you through turning points, transitions, and transformations with clarity and confidence.
                </p>
              </div>
            </div>

            {/* Empowerment Section */}
            <div className="border-t pt-12">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">🌠 Empowerment Through Celestial Wisdom</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  We believe that true empowerment begins with understanding yourself through the wisdom of the stars. Our mission at true Astrotalk is to make astrology accessible, authentic, and enlightening for everyone.
                </p>
                <p>
                  Through our blogs, masterclasses, videos, and one-on-one consultations, we simplify the sacred art of astrology and turn curiosity into deep cosmic understanding.
                </p>
                <blockquote className="border-l-4 border-purple-500 pl-6 py-2 italic text-lg text-gray-800 bg-purple-50 rounded-r-lg my-6">
                  "Astrology is not about predicting the future — it's about using the wisdom of the cosmos to create a brighter, more harmonious present."
                </blockquote>
                <p>
                  As a modern, trusted astrology platform, true Astrotalk doesn't just interpret planetary movements — we teach you how to live in alignment with them. We empower you to manifest success, peace, and balance by understanding the celestial energies influencing your life.
                </p>
              </div>
            </div>

            {/* Why Choose true Astrotalk Section */}
            <div className="border-t pt-12">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">🌌 Why Choose true Astrotalk?</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  As one of the most trusted and spiritually rooted astrology platforms in India, true Astrotalk stands apart for its authenticity, accuracy, and integrity. Here's what makes us your ideal cosmic guide:
                </p>
                <div className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">✨ Authenticity and Precision:</h4>
                    <p>We seamlessly blend ancient Vedic astrology with modern analytical insights, ensuring each reading is both spiritually deep and practically relevant.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">🌕 Experienced Astrologers:</h4>
                    <p>Our team comprises highly skilled, compassionate, and certified astrologers who bring decades of expertise to every reading.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">🌿 Holistic Guidance:</h4>
                    <p>We believe life is interconnected — that's why our readings encompass career, love, health, wealth, education, and personal growth for complete balance.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">🪶 Personalized Consultations:</h4>
                    <p>Every session is tailored to your unique Kundli and life circumstances, ensuring you receive accurate, insightful, and transformative advice.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">💫 Easy Accessibility:</h4>
                    <p>With online consultations, instant reports, and 24x7 availability, true Astrotalk brings authentic astrology guidance to your fingertips.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing Section */}
            <div className="border-t pt-12">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">🌞 Discover the Power of Astrology with true Astrotalk</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Astrology is not just about knowing what lies ahead — it's about understanding who you truly are and why you're here. At true Astrotalk, we invite you to embark on a journey of cosmic awareness, confidence, and inner transformation.
                </p>
                <p>
                  Whether you seek clarity in one area of life or wish to explore your broader destiny, our expert astrologers illuminate your path with precision, compassion, and spiritual wisdom.
                </p>
                <p className="font-semibold text-lg text-purple-700 mt-6">
                  Let the celestial forces guide you toward harmony, fulfillment, and success. Choose true Astrotalk — where ancient wisdom meets modern consciousness, and every reading becomes a gateway to self-discovery, balance, and enlightenment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
