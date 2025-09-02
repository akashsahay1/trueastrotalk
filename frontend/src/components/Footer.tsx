import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <img 
              src="/lovable-uploads/e7ea263c-3fc3-4c24-a313-de804c9f1d3f.png" 
              alt="True Astrotalk Logo" 
              className="h-12 w-auto mb-4 filter brightness-0 invert"
            />
            <p className="text-gray-400 text-sm mb-4">
              Connect with true Astrology experts. Get your future unfolded by our trusted and experienced Astrologers.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-blue-500 hover:text-blue-400 cursor-pointer" />
              <Twitter className="w-5 h-5 text-blue-400 hover:text-blue-300 cursor-pointer" />
              <Instagram className="w-5 h-5 text-pink-500 hover:text-pink-400 cursor-pointer" />
              <Youtube className="w-5 h-5 text-red-500 hover:text-red-400 cursor-pointer" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/about-astrology" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Our Team</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Call & Chat</a></li>
              <li><a href="#" className="hover:text-white">Love & Relationship</a></li>
              <li><a href="#" className="hover:text-white">Career Guidance</a></li>
              <li><a href="#" className="hover:text-white">Daily Horoscope</a></li>
              <li><a href="#" className="hover:text-white">Tarot Reading</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Info</h3>
            <div className="text-gray-400 space-y-2">
              <p className="text-sm">
                Near- DAV Nageswar Public School, Tetri, Chandaghasi, Ranchi-834010
              </p>
              <p className="text-sm">
                📞 +91-9835635299
              </p>
              <p className="text-sm">
                ✉️ info@trueastrotalk.com
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 true Astrotalk (Powered by NAAMRE SERVICES (OPC) PRIVATE LIMITED). All Rights Reserved
          </p>
          <div className="mt-4 space-x-4 text-sm">
            <a href="/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</a>
            <a href="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
