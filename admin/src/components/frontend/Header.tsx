"use client";

import React, { useState } from "react";
import Link from "next/link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDropdownToggle = (dropdown: string) => {
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
    <header className="bg-white shadow-md sticky-top" style={{zIndex: 1000}}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="navbar navbar-expand-lg navbar-light px-0" style={{height: '64px'}}>
              {/* Logo */}
              <Link href="/" className="navbar-brand d-flex align-items-center">
                <img 
                  src="/lovable-uploads/e7ea263c-3fc3-4c24-a313-de804c9f1d3f.png" 
                  alt="Astrotalk" 
                  style={{height: '40px', width: '40px'}}
                />
                <span className="ml-2 h4 mb-0 font-weight-bold" style={{color: '#7c3aed'}}>Astrotalk</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="navbar-toggler"
                type="button"
                onClick={toggleMenu}
                aria-expanded={isMenuOpen}
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              {/* Desktop Navigation */}
              <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
                <ul className="navbar-nav ml-auto align-items-center">
                  <li className="nav-item">
                    <Link href="/" className="nav-link text-gray-700">
                      Home
                    </Link>
                  </li>

                  {/* Horoscope Dropdown */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle text-gray-700" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Horoscope
                    </a>
                    <div className="dropdown-menu shadow-lg border-0" style={{minWidth: '320px'}}>
                      <div className="row p-2">
                        {horoscopeItems.map((item) => (
                          <div key={item.path} className="col-6 p-1">
                            <Link href={item.path} className="dropdown-item small py-1 px-3 text-gray-700">
                              {item.name}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>

                  {/* Services Dropdown */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle text-gray-700" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Services
                    </a>
                    <div className="dropdown-menu shadow-lg border-0" style={{minWidth: '280px'}}>
                      {serviceItems.map((item) => (
                        <Link key={item.path} href={item.path} className="dropdown-item py-2 text-gray-700">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </li>

                  {/* Calculators Dropdown */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle text-gray-700" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Calculators
                    </a>
                    <div className="dropdown-menu shadow-lg border-0" style={{minWidth: '280px'}}>
                      {calculatorItems.map((item) => (
                        <Link key={item.path} href={item.path} className="dropdown-item py-2 text-gray-700">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </li>

                  {/* About Dropdown */}
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle text-gray-700" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      About
                    </a>
                    <div className="dropdown-menu shadow-lg border-0" style={{minWidth: '280px'}}>
                      {aboutItems.map((item) => (
                        <Link key={item.path} href={item.path} className="dropdown-item py-2 text-gray-700">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </li>
                </ul>

                {/* Action Buttons */}
                <div className="d-none d-lg-flex align-items-center ml-4">
                  <Link href="/astrologer-registration" className="btn btn-outline-warning btn-sm mr-3 d-flex align-items-center" style={{color: '#f59e0b', borderColor: '#f59e0b'}}>
                    <svg width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                    Join as Astrologer
                  </Link>
                  <button className="btn btn-outline-primary btn-sm mr-2 d-flex align-items-center">
                    <svg width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                    </svg>
                    Call Now
                  </button>
                  <button className="btn btn-primary btn-sm mr-2 d-flex align-items-center" style={{backgroundColor: '#7c3aed', borderColor: '#7c3aed'}}>
                    <svg width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                      <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c-.395.5-.962.5-1.279.5-.317 0-.884 0-1.279-.5a10.97 10.97 0 0 1-.398-2 1 1 0 0 1 .287-.801C1.95 10.645 2.253 10 2.253 10s.297.645 1.349 1.894zM11 2.82a1 1 0 0 1-.287-.801c.043-.524.162-1.03.398-1.5.395-.5.962-.5 1.279-.5.317 0 .884 0 1.279.5.236.47.355.976.398 1.5a1 1 0 0 1-.287.801C12.05 3.355 11.747 4 11.747 4S11.45 3.355 11 2.82z"/>
                      <path d="M14 5a1 1 0 0 1-1 1H9v4a1 1 0 0 1-2 0V6H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2z"/>
                    </svg>
                    Chat Now
                  </button>
                  <button className="btn btn-link btn-sm p-2">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation Menu */}
              {isMenuOpen && (
                <div className="d-lg-none w-100 position-absolute bg-white shadow-lg border-top" style={{top: '100%', left: 0, zIndex: 999}}>
                  <div className="container">
                    <div className="row">
                      <div className="col-12">
                        <div className="py-3">
                          <Link href="/" className="d-block py-2 text-gray-700 border-bottom" onClick={() => setIsMenuOpen(false)}>
                            Home
                          </Link>
                          
                          {/* Mobile Horoscope */}
                          <div className="py-2 border-bottom">
                            <button 
                              className="btn btn-link w-100 text-left p-0 d-flex justify-content-between align-items-center text-gray-900 font-weight-medium"
                              onClick={() => handleDropdownToggle('mobile-horoscope')}
                            >
                              Horoscope
                              <svg width="16" height="16" fill="currentColor" className={`transform ${activeDropdown === 'mobile-horoscope' ? 'rotate-180' : ''}`} viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                              </svg>
                            </button>
                            {activeDropdown === 'mobile-horoscope' && (
                              <div className="mt-2 pl-3">
                                <div className="row">
                                  {horoscopeItems.map((item) => (
                                    <div key={item.path} className="col-6">
                                      <Link 
                                        href={item.path} 
                                        className="d-block py-1 text-muted small"
                                        onClick={() => setIsMenuOpen(false)}
                                      >
                                        {item.name}
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Mobile Services */}
                          <div className="py-2 border-bottom">
                            <button 
                              className="btn btn-link w-100 text-left p-0 d-flex justify-content-between align-items-center text-gray-900 font-weight-medium"
                              onClick={() => handleDropdownToggle('mobile-services')}
                            >
                              Services
                              <svg width="16" height="16" fill="currentColor" className={`transform ${activeDropdown === 'mobile-services' ? 'rotate-180' : ''}`} viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                              </svg>
                            </button>
                            {activeDropdown === 'mobile-services' && (
                              <div className="mt-2 pl-3">
                                {serviceItems.map((item) => (
                                  <Link 
                                    key={item.path}
                                    href={item.path} 
                                    className="d-block py-1 text-muted"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Mobile Calculators */}
                          <div className="py-2 border-bottom">
                            <button 
                              className="btn btn-link w-100 text-left p-0 d-flex justify-content-between align-items-center text-gray-900 font-weight-medium"
                              onClick={() => handleDropdownToggle('mobile-calculators')}
                            >
                              Calculators
                              <svg width="16" height="16" fill="currentColor" className={`transform ${activeDropdown === 'mobile-calculators' ? 'rotate-180' : ''}`} viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                              </svg>
                            </button>
                            {activeDropdown === 'mobile-calculators' && (
                              <div className="mt-2 pl-3">
                                {calculatorItems.map((item) => (
                                  <Link 
                                    key={item.path}
                                    href={item.path} 
                                    className="d-block py-1 text-muted"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Mobile About */}
                          <div className="py-2 border-bottom">
                            <button 
                              className="btn btn-link w-100 text-left p-0 d-flex justify-content-between align-items-center text-gray-900 font-weight-medium"
                              onClick={() => handleDropdownToggle('mobile-about')}
                            >
                              About
                              <svg width="16" height="16" fill="currentColor" className={`transform ${activeDropdown === 'mobile-about' ? 'rotate-180' : ''}`} viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                              </svg>
                            </button>
                            {activeDropdown === 'mobile-about' && (
                              <div className="mt-2 pl-3">
                                {aboutItems.map((item) => (
                                  <Link 
                                    key={item.path}
                                    href={item.path} 
                                    className="d-block py-1 text-muted"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          <Link 
                            href="/astrologer-registration" 
                            className="d-block py-2 text-warning font-weight-medium border border-warning rounded text-center mt-3"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Join as Astrologer
                          </Link>

                          <div className="mt-3">
                            <button className="btn btn-primary w-100 mb-2" style={{backgroundColor: '#7c3aed', borderColor: '#7c3aed'}}>
                              Chat Now
                            </button>
                            <button className="btn btn-outline-primary w-100">
                              Call Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dropdown:hover .dropdown-menu {
          display: block;
        }
        .text-gray-700 {
          color: #374151 !important;
        }
        .text-gray-900 {
          color: #111827 !important;
        }
        .transform.rotate-180 {
          transform: rotate(180deg);
        }
      `}</style>
    </header>
  );
};

export default Header;