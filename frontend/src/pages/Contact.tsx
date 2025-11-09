import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
          <p className="text-center text-muted-foreground mb-12">
            Get in touch with us for any inquiries or support. We're here to help you with all your astrology needs.
          </p>

          {/* Contact Information Cards in One Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Phone</h3>
                  <a
                    href="tel:+919835635299"
                    className="text-primary hover:underline"
                  >
                    +91-9835635299
                  </a>
                  <p className="text-muted-foreground text-xs mt-2">
                    Available 24/7
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Email</h3>
                  <a
                    href="mailto:info@trueastrotalk.com"
                    className="text-primary hover:underline"
                  >
                    info@trueastrotalk.com
                  </a>
                  <p className="text-muted-foreground text-xs mt-2">
                    Response within 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Address</h3>
                  <p className="text-muted-foreground text-sm">
                    Near- DAV Nageswar Public School<br />
                    Tetri, Chandaghasi<br />
                    Ranchi-834010, Jharkhand
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Map */}
          <div className="mb-12">
            <div className="rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
              <iframe
                src="https://www.google.com/maps?q=23.3851789,85.3239654&hl=en&z=15&output=embed"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="True Astrotalk Location"
              ></iframe>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 bg-primary/5 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">Why Choose True Astrotalk?</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground">Available Round the Clock</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100+</div>
                <p className="text-muted-foreground">Expert Astrologers</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10k+</div>
                <p className="text-muted-foreground">Satisfied Clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
