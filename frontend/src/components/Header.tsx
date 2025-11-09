import React from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import LazyImage from "./LazyImage";

const Header = () => {
  console.log("Header component rendering...");
  
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

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
    { name: "Lucky Mobile Calculator", path: "/lucky-mobile-calculator" },
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
    <header className="bg-card shadow-md sticky top-0 z-50 border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 logo">
            <img
              src="/images/logo.jpeg"
              alt="Astrotalk Logo"
              className="h-12 w-auto"
            />
						<span className="logotext">true Astrotalk</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>

            {/* About Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('about')}
              >
                About
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-card shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-border">
                <div className="py-2">
                  {aboutItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-4 py-2 text-muted-foreground hover:bg-muted"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Horoscope Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('horoscope')}
              >
                Horoscope
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-card shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-border">
                <div className="py-2 grid grid-cols-2 gap-1">
                  {horoscopeItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-4 py-2 text-muted-foreground hover:bg-muted text-sm"
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
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('services')}
              >
                Services
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-card shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-border">
                <div className="py-2">
                  {serviceItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-4 py-2 text-muted-foreground hover:bg-muted"
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
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleDropdownToggle('calculators')}
              >
                Calculators
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-card shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-border">
                <div className="py-2">
                  {calculatorItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-4 py-2 text-muted-foreground hover:bg-muted"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact */}
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>


          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <nav className="py-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 text-muted-foreground hover:bg-muted rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {/* Mobile About */}
              <div className="px-4 py-2">
                <button
                  className="w-full text-left font-medium text-card-foreground mb-2 flex items-center justify-between"
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
                        className="block py-1 text-muted-foreground hover:text-primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Horoscope */}
              <div className="px-4 py-2">
                <button
                  className="w-full text-left font-medium text-card-foreground mb-2 flex items-center justify-between"
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
                        className="block py-1 text-muted-foreground hover:text-primary text-sm"
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
                  className="w-full text-left font-medium text-card-foreground mb-2 flex items-center justify-between"
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
                        className="block py-1 text-muted-foreground hover:text-primary"
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
                  className="w-full text-left font-medium text-card-foreground mb-2 flex items-center justify-between"
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
                        className="block py-1 text-muted-foreground hover:text-primary"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Contact */}
              <Link
                to="/contact"
                className="block px-4 py-2 text-muted-foreground hover:bg-muted rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
