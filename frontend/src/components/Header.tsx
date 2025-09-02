import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, MessageCircle, User, ChevronDown } from "lucide-react";
import LazyImage from "./LazyImage";

const Header = () => {
  console.log("Header component rendering...");
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMenu = () => {
    console.log("Toggle menu clicked");
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDropdownToggle = (dropdown: string) => {
    console.log("Dropdown toggle:", dropdown);
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const horoscopeItems = [
    { name: "Aries", path: "/horoscope/aries" },
    { name: "Taurus", path: "/horoscope/taurus" },
    { name: "Gemini", path: "/horoscope/gemini" },
    { name: "Cancer", path: "/horoscope/cancer" },
    { name: "Leo", path: "/horoscope/leo" },
    { name: "Virgo", path: "/horoscope/virgo" },
    { name: "Libra", path: "/horoscope/libra" },
    { name: "Scorpio", path: "/horoscope/scorpio" },
    { name: "Sagittarius", path: "/horoscope/sagittarius" },
    { name: "Capricorn", path: "/horoscope/capricorn" },
    { name: "Aquarius", path: "/horoscope/aquarius" },
    { name: "Pisces", path: "/horoscope/pisces" }
  ];

  const serviceItems = [
    { name: "Love Problems", path: "/services/love-problems" },
    { name: "Marriage Guidance", path: "/services/marriage-guidance" },
    { name: "Career Guidance", path: "/services/career-guidance" },
    { name: "Financial Consultation", path: "/services/financial-consultation" },
    { name: "Business Problems", path: "/services/business-problems" },
    { name: "Auspicious Time", path: "/services/auspicious-time" },
    { name: "Horoscope Reading", path: "/services/horoscope-reading" }
  ];

  const calculatorItems = [
    { name: "Kundali Matching", path: "/kundali-matching" },
    { name: "Numerology Calculator", path: "/numerology-calculator" },
    { name: "Love Calculator", path: "/love-calculator" },
    { name: "Signature Analysis", path: "/signature-calculator" },
    { name: "Rashi Calculator", path: "/rashi-calculator" },
    { name: "Nakshatra Calculator", path: "/nakshatra-calculator" },
    { name: "Panchak Calculator", path: "/panchak-calculator" },
    { name: "LoShu Grid Calculator", path: "/loshu-grid-calculator" },
    { name: "Vedic Panchang", path: "/vedic-panchang" },
    { name: "Ascendant Gemstones", path: "/ascendant-gemstones" }
  ];

  const aboutItems = [
    { name: "About Astrology", path: "/about-astrology" },
    { name: "True Astrotalk", path: "/about/trueastrotalk" },
    { name: "Kundali", path: "/about/kundali" },
    { name: "Palmistry", path: "/about/palmistry" },
    { name: "Life Coach", path: "/about/lifecoach" },
    { name: "Nadi", path: "/about/nadi" },
    { name: "Vedic", path: "/about/vedic" },
    { name: "Tarot", path: "/about/tarot" },
    { name: "Lal Kitab", path: "/about/lalkitab" },
    { name: "Vastu", path: "/about/vastu" },
    { name: "Psychic", path: "/about/psychic" },
    { name: "Numerology", path: "/about/numerology" },
    { name: "KP Astrology", path: "/about/kp" }
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <LazyImage
              src="/lovable-uploads/e7ea263c-3fc3-4c24-a313-de804c9f1d3f.png"
              alt="Astrotalk"
              className="h-10 w-10"
              width={40}
              height={40}
            />
            <span className="text-2xl font-bold text-primary">Astrotalk</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              Home
            </Link>
            
            {/* Horoscope Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('horoscope')}
              >
                Horoscope
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2 grid grid-cols-2 gap-1">
                  {horoscopeItems.map((item) => (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Services Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('services')}
              >
                Services
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {serviceItems.map((item) => (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculators Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('calculators')}
              >
                Calculators
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {calculatorItems.map((item) => (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* About Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center text-gray-700 hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('about')}
              >
                About
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {aboutItems.map((item) => (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/astrologer-registration">
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-orange-600 border-orange-600 hover:bg-orange-50">
                <User className="w-4 h-4" />
                Join as Astrologer
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call Now
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat Now
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {/* Mobile Horoscope */}
              <div className="px-4 py-2">
                <button 
                  className="w-full text-left font-medium text-gray-900 mb-2 flex items-center justify-between"
                  onClick={() => handleDropdownToggle('mobile-horoscope')}
                >
                  Horoscope
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'mobile-horoscope' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'mobile-horoscope' && (
                  <div className="ml-4 space-y-1 grid grid-cols-2 gap-1">
                    {horoscopeItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className="block py-1 text-gray-600 hover:text-blue-600 text-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Services */}
              <div className="px-4 py-2">
                <button 
                  className="w-full text-left font-medium text-gray-900 mb-2 flex items-center justify-between"
                  onClick={() => handleDropdownToggle('mobile-services')}
                >
                  Services
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'mobile-services' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'mobile-services' && (
                  <div className="ml-4 space-y-1">
                    {serviceItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className="block py-1 text-gray-600 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Calculators */}
              <div className="px-4 py-2">
                <button 
                  className="w-full text-left font-medium text-gray-900 mb-2 flex items-center justify-between"
                  onClick={() => handleDropdownToggle('mobile-calculators')}
                >
                  Calculators
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'mobile-calculators' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'mobile-calculators' && (
                  <div className="ml-4 space-y-1">
                    {calculatorItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className="block py-1 text-gray-600 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile About */}
              <div className="px-4 py-2">
                <button 
                  className="w-full text-left font-medium text-gray-900 mb-2 flex items-center justify-between"
                  onClick={() => handleDropdownToggle('mobile-about')}
                >
                  About
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'mobile-about' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'mobile-about' && (
                  <div className="ml-4 space-y-1">
                    {aboutItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className="block py-1 text-gray-600 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/astrologer-registration"
                className="block px-4 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded-md border border-orange-600 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Join as Astrologer
              </Link>

              <div className="px-4 py-4 space-y-2">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Chat Now
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Call Now
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
