import Link from "next/link";

const Footer = () => {
  return (
    <footer style={{backgroundColor: '#111827'}} className="text-white py-5">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="row">
              <div className="col-md-3 mb-4">
                <img 
                  src="/lovable-uploads/e7ea263c-3fc3-4c24-a313-de804c9f1d3f.png" 
                  alt="True Astrotalk Logo" 
                  style={{height: '48px', width: 'auto'}}
                  className="mb-4"
                />
                <p className="small mb-4" style={{color: '#9CA3AF'}}>
                  Connect with true Astrology experts. Get your future unfolded by our trusted and experienced Astrologers.
                </p>
                <div className="d-flex">
                  <a href="#" className="mr-4" style={{color: '#3B82F6'}}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="mr-4" style={{color: '#60A5FA'}}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="mr-4" style={{color: '#EC4899'}}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.747 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.99C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                  <a href="#" style={{color: '#EF4444'}}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <div className="col-md-3 mb-4">
                <h5 className="font-weight-bold mb-4" style={{fontSize: '18px'}}>Quick Links</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Link href="/" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Home
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="/about-astrology" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      About Us
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Our Team
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Blog
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="col-md-3 mb-4">
                <h5 className="font-weight-bold mb-4" style={{fontSize: '18px'}}>Services</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Call & Chat
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Love & Relationship
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Career Guidance
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Daily Horoscope
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Tarot Reading
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="col-md-3 mb-4">
                <h5 className="font-weight-bold mb-4" style={{fontSize: '18px'}}>Contact Info</h5>
                <div style={{color: '#9CA3AF'}}>
                  <p className="small mb-3">
                    Near- DAV Nageswar Public School, Tetri, Chandaghasi, Ranchi-834010
                  </p>
                  <p className="small mb-2">
                    📞 +91-9835635299
                  </p>
                  <p className="small mb-2">
                    ✉️ info@trueastrotalk.com
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{borderTop: '1px solid #374151'}} className="mt-5 pt-4">
              <div className="row">
                <div className="col-12 text-center">
                  <p className="small mb-2" style={{color: '#9CA3AF'}}>
                    © 2025 true Astrotalk (Powered by NAAMRE SERVICES (OPC) PRIVATE LIMITED). All Rights Reserved
                  </p>
                  <div className="mt-3">
                    <Link href="/terms-of-service" className="text-decoration-none mr-4" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Terms of Service
                    </Link>
                    <Link href="/privacy-policy" className="text-decoration-none" style={{color: '#9CA3AF', fontSize: '14px'}}>
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        a:hover {
          color: #fff !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;