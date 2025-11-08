import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <img 
              src="/lovable-uploads/7533bfdf-8cad-46b3-8f85-d4e92a3928fe.png" 
              alt="True Astrotalk Logo" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-muted-foreground text-sm mb-4">
              Connect with true Astrology experts. Get your future unfolded by our trusted and experienced Astrologers.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-primary hover:text-primary/80 cursor-pointer" />
              <Twitter className="w-5 h-5 text-primary hover:text-primary/80 cursor-pointer" />
              <Instagram className="w-5 h-5 text-primary hover:text-primary/80 cursor-pointer" />
              <Youtube className="w-5 h-5 text-primary hover:text-primary/80 cursor-pointer" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-background">Quick Links</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="/" className="hover:text-primary">Home</a></li>
              <li><a href="/about-astrology" className="hover:text-primary">About Us</a></li>
              <li><a href="#" className="hover:text-primary">Our Team</a></li>
              <li><a href="#" className="hover:text-primary">Blog</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-background">Services</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Call & Chat</a></li>
              <li><a href="#" className="hover:text-primary">Love & Relationship</a></li>
              <li><a href="#" className="hover:text-primary">Career Guidance</a></li>
              <li><a href="#" className="hover:text-primary">Daily Horoscope</a></li>
              <li><a href="#" className="hover:text-primary">Tarot Reading</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-background">Contact Info</h3>
            <div className="text-muted-foreground space-y-2">
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
        
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 true Astrotalk (Powered by NAAMRE SERVICES (OPC) PRIVATE LIMITED). All Rights Reserved
          </p>
          <div className="mt-4 space-x-4 text-sm">
            <a href="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</a>
            <a href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
