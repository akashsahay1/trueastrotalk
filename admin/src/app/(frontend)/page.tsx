"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/frontend/Header";
import Footer from "@/components/frontend/Footer";
import LazyImage from "@/components/frontend/LazyImage";
import SlidingAstrologers from "@/components/frontend/SlidingAstrologers";

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
      features: ["36 Guna Matching", "Manglik Dosha Check", "Compatibility Score", "Detailed Report"],
      price: "Free",
      link: "/kundali-matching",
      registrationRequired: false
    },
    {
      title: "Love Calculator", 
      description: "Discover love compatibility between partners using names and birth details",
      features: ["Name Compatibility", "Birth Date Analysis", "Love Percentage", "Relationship Tips"],
      price: "Free",
      link: "/love-calculator",
      registrationRequired: false
    },
    {
      title: "Advanced Name Numerology",
      description: "Get detailed numerology analysis based on your name and birth date",
      features: ["Lucky Numbers", "Name Analysis", "Career Guidance", "Personality Traits"],
      price: "₹99",
      link: "/numerology-calculator",
      registrationRequired: false
    },
    {
      title: "Rashi Calculator",
      description: "Find your moon sign (Rashi) based on birth details",
      features: ["Moon Sign Calculation", "Rashi Characteristics", "Lucky Elements", "Predictions"],
      price: "Free",
      link: "/rashi-calculator",
      registrationRequired: false
    },
    {
      title: "Nakshatra Calculator",
      description: "Determine your birth star and its significance",
      features: ["Birth Star Analysis", "Personality Traits", "Lucky Days", "Career Path"],
      price: "Free",
      link: "/nakshatra-calculator",
      registrationRequired: false
    },
    {
      title: "Panchak Calculator",
      description: "Calculate Panchak periods for auspicious timing",
      features: ["Panchak Analysis", "Timing Guidance", "Ritual Planning", "Monthly Calendar"],
      price: "Free",
      link: "/panchak-calculator",
      registrationRequired: false
    },
    {
      title: "LoShu Grid Calculator",
      description: "Chinese numerology grid analysis for life insights",
      features: ["Life Path Analysis", "Missing Numbers", "Remedial Solutions", "Personality Mapping"],
      price: "Free",
      link: "/loshu-grid-calculator",
      registrationRequired: false
    },
    {
      title: "Signature Analysis",
      description: "Analyze your signature for personality insights",
      features: ["Signature Upload", "Personality Analysis", "Career Guidance", "Improvement Tips"],
      price: "Free",
      link: "/signature-calculator",
      registrationRequired: false
    }
  ];

  // Zodiac Signs Data
  const zodiacSigns = [
    { name: "Aries", symbol: "🐏", dates: "Mar 21 - Apr 19", element: "Fire" },
    { name: "Taurus", symbol: "🐂", dates: "Apr 20 - May 20", element: "Earth" },
    { name: "Gemini", symbol: "👥", dates: "May 21 - Jun 20", element: "Air" },
    { name: "Cancer", symbol: "🦀", dates: "Jun 21 - Jul 22", element: "Water" },
    { name: "Leo", symbol: "🦁", dates: "Jul 23 - Aug 22", element: "Fire" },
    { name: "Virgo", symbol: "👸", dates: "Aug 23 - Sep 22", element: "Earth" },
    { name: "Libra", symbol: "⚖️", dates: "Sep 23 - Oct 22", element: "Air" },
    { name: "Scorpio", symbol: "🦂", dates: "Oct 23 - Nov 21", element: "Water" },
    { name: "Sagittarius", symbol: "🏹", dates: "Nov 22 - Dec 21", element: "Fire" },
    { name: "Capricorn", symbol: "🐐", dates: "Dec 22 - Jan 19", element: "Earth" },
    { name: "Aquarius", symbol: "🏺", dates: "Jan 20 - Feb 18", element: "Air" },
    { name: "Pisces", symbol: "🐠", dates: "Feb 19 - Mar 20", element: "Water" }
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

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#1877f2'}}>
      <Header />
      
      {/* Hero Section with Auto-Sliding */}
      <section className="position-relative" style={{minHeight: '100vh', backgroundColor: '#1877f2'}}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="row align-items-center" style={{minHeight: '80vh', paddingTop: '120px', paddingBottom: '80px'}}>
                
                {/* Left Side Content */}
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <h1 className="display-3 font-weight-bold text-white mb-4" style={{lineHeight: 1.2}}>
                    {currentSlideData.title.split(' ').slice(0, 2).join(' ')}<br />
                    <span className="text-warning">{currentSlideData.title.split(' ').slice(2).join(' ')}</span>
                  </h1>
                  
                  <p className="h5 text-white mb-4" style={{opacity: 0.9, maxWidth: '400px'}}>
                    {currentSlideData.subtitle}
                  </p>

                  {/* Statistics Card */}
                  <div className="bg-white rounded p-4 shadow-lg mb-4" style={{maxWidth: '300px'}}>
                    <div className="h2 font-weight-bold text-success mb-2">
                      {currentSlideData.stats.clients}
                    </div>
                    <div className="text-dark font-weight-medium mb-3">Happy Clients</div>
                    <div className="d-flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-warning mr-1" style={{fontSize: '20px'}}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex flex-column flex-sm-row">
                    <button className="btn btn-warning btn-lg mb-2 mb-sm-0 mr-sm-3 px-4 py-2">
                      💬 Chat Now
                    </button>
                    <button className="btn btn-outline-light btn-lg px-4 py-2">
                      📞 Call Now
                    </button>
                  </div>
                </div>

                {/* Right Side - Astrologer Image with Badges */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center">
                  <div className="position-relative">
                    {/* Main Astrologer Image */}
                    <div className="rounded-circle overflow-hidden border border-white shadow" style={{width: '320px', height: '320px', borderWidth: '8px'}}>
                      <img
                        src={currentSlideData.image}
                        alt="Expert Astrologer"
                        className="w-100 h-100"
                        style={{objectFit: 'cover'}}
                      />
                    </div>

                    {/* Experience Badge - Top Right */}
                    <div className="position-absolute bg-warning text-white rounded px-3 py-2 shadow" style={{top: '-16px', right: '-32px'}}>
                      <div className="h4 font-weight-bold mb-0">{currentSlideData.stats.experience}</div>
                      <div style={{fontSize: '12px'}}>Years Experience</div>
                    </div>

                    {/* Success Rate Badge - Bottom Left */}
                    <div className="position-absolute bg-success text-white rounded-circle d-flex flex-column align-items-center justify-content-center shadow" style={{bottom: '-24px', left: '-32px', width: '112px', height: '112px'}}>
                      <div className="h5 font-weight-bold mb-0">{currentSlideData.stats.success}</div>
                      <div style={{fontSize: '12px'}}>Success</div>
                    </div>
                  </div>

                  {/* Expert Astrologer Card - Right Side */}
                  <div className="position-absolute bg-white rounded p-4 shadow" style={{right: '-16px', top: '50%', transform: 'translateY(-50%)', maxWidth: '240px'}}>
                    <div className="bg-primary text-white px-3 py-2 rounded text-center font-weight-bold mb-3" style={{fontSize: '12px'}}>
                      EXPERT ASTROLOGER
                    </div>
                    
                    <h6 className="text-dark font-weight-bold mb-3">Our Services</h6>
                    <div className="mb-3">
                      {currentSlideData.services.map((service, index) => (
                        <div key={index} className="d-flex align-items-center text-dark mb-2">
                          <div className="bg-primary rounded-circle mr-2" style={{width: '8px', height: '8px'}}></div>
                          <span style={{fontSize: '14px'}}>{service}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-top">
                      <div className="h4 font-weight-bold text-warning mb-0">{currentSlideData.stats.accuracy}</div>
                      <div style={{fontSize: '12px'}} className="text-muted">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="position-absolute d-flex justify-content-center" style={{bottom: '32px', left: '50%', transform: 'translateX(-50%)'}}>
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`btn rounded-circle mr-2 ${index === currentSlide ? 'btn-light' : 'btn-outline-light'}`}
                    style={{width: '12px', height: '12px', padding: 0, border: 'none', opacity: index === currentSlide ? 1 : 0.5}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zodiac Signs Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="text-center mb-5">
                <h2 className="h2 font-weight-bold mb-3">Read All Zodiac Sign's Horoscopes</h2>
                <p className="text-muted">Discover your daily, weekly, and monthly predictions</p>
              </div>
              
              <div className="row">
                {zodiacSigns.map((sign, index) => (
                  <div key={index} className="col-6 col-md-4 col-lg-2 mb-4">
                    <Link href={`/horoscope/${sign.name.toLowerCase()}`} className="text-decoration-none">
                      <div className="card h-100 shadow-sm border-0" style={{transition: 'all 0.3s ease'}}>
                        <div className="card-body text-center p-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm mx-auto mb-3" 
                               style={{width: '80px', height: '80px', fontSize: '48px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                            {sign.symbol}
                          </div>
                          <h6 className="card-title font-weight-bold text-dark mb-1">{sign.name}</h6>
                          <p className="small text-muted mb-2">{sign.dates}</p>
                          <span className="badge badge-secondary small">{sign.element}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nakshatras Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="text-center mb-5">
                <h2 className="h2 font-weight-bold mb-3">Nakshatras</h2>
                <p className="text-muted">Discover the 27 lunar mansions and their significance in Vedic astrology</p>
              </div>
              
              <div className="row">
                {nakshatras.slice(0, 18).map((nakshatra, index) => (
                  <div key={index} className="col-6 col-md-4 col-lg-3 col-xl-2 mb-3">
                    <Link href={index === 0 ? "/about/ashwini" : "#"} className="text-decoration-none">
                      <div className="card h-100 shadow-sm border-0" style={{transition: 'all 0.3s ease'}}>
                        <div className="card-body text-center p-3">
                          <div className="mb-2" style={{fontSize: '32px'}}>{nakshatra.symbol}</div>
                          <h6 className="card-title font-weight-bold text-primary mb-1" style={{fontSize: '14px'}}>{nakshatra.name}</h6>
                          <p className="small text-muted mb-1">Lord: {nakshatra.lord}</p>
                          <span className="badge badge-outline-secondary small">{nakshatra.nature}</span>
                          {index === 0 && (
                            <div className="mt-2">
                              <button className="btn btn-sm btn-outline-primary">Learn More</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Astrologers Section - Using SlidingAstrologers Component */}
      <SlidingAstrologers />

      <Footer />
    </div>
  );
};

export default Index;