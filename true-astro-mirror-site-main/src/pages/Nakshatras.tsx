import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const nakshatras = [
  { name: 'Ashwini', lord: 'Ketu', element: 'Divine', emoji: '🐎', path: '/about/ashwini' },
  { name: 'Bharani', lord: 'Venus', element: 'Human', emoji: '🌸', path: '/about/bharani' },
  { name: 'Krittika', lord: 'Sun', element: 'Demon', emoji: '🔥', path: '/about/krittika' },
  { name: 'Rohini', lord: 'Moon', element: 'Human', emoji: '🌙', path: '/about/rohini' },
  { name: 'Mrigashira', lord: 'Mars', element: 'Divine', emoji: '🦌', path: '/about/mrigashira' },
  { name: 'Ardra', lord: 'Rahu', element: 'Human', emoji: '💎', path: '/about/ardra' },
  { name: 'Punarvasu', lord: 'Jupiter', element: 'Divine', emoji: '🏹', path: '/about/punarvasu' },
  { name: 'Pushya', lord: 'Saturn', element: 'Divine', emoji: '🌸', path: '/about/pushya' },
  { name: 'Ashlesha', lord: 'Mercury', element: 'Demon', emoji: '🐍', path: '/about/ashlesha' },
  { name: 'Magha', lord: 'Ketu', element: 'Demon', emoji: '👑', path: '/about/magha' },
  { name: 'Purva Phalguni', lord: 'Venus', element: 'Human', emoji: '🛏️', path: '/about/purva-phalguni' },
  { name: 'Uttara Phalguni', lord: 'Sun', element: 'Human', emoji: '🤝', path: '/about/uttara-phalguni' },
  { name: 'Hasta', lord: 'Moon', element: 'Divine', emoji: '✋', path: '/about/hasta' },
  { name: 'Chitra', lord: 'Mars', element: 'Demon', emoji: '💎', path: '/about/chitra' },
  { name: 'Swati', lord: 'Rahu', element: 'Divine', emoji: '🌿', path: '/about/swati' },
  { name: 'Vishakha', lord: 'Jupiter', element: 'Demon', emoji: '🏛️', path: '/about/vishakha' },
  { name: 'Anuradha', lord: 'Saturn', element: 'Divine', emoji: '🎯', path: '/about/anuradha' },
  { name: 'Jyeshtha', lord: 'Mercury', element: 'Demon', emoji: '🌙', path: '/about/jyeshtha' },
  { name: 'Mula', lord: 'Ketu', element: 'Demon', emoji: '🌱', path: '/about/mula' },
  { name: 'Purva Ashadha', lord: 'Venus', element: 'Human', emoji: '🌊', path: '/about/purva-ashadha' },
  { name: 'Uttara Ashadha', lord: 'Sun', element: 'Human', emoji: '🏔️', path: '/about/uttara-ashadha' },
  { name: 'Shravana', lord: 'Moon', element: 'Divine', emoji: '👂', path: '/about/shravana' },
  { name: 'Dhanishta', lord: 'Mars', element: 'Demon', emoji: '🥁', path: '/about/dhanishta' },
  { name: 'Shatabhisha', lord: 'Rahu', element: 'Demon', emoji: '⭕', path: '/about/shatabhisha' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', element: 'Human', emoji: '🔥', path: '/about/purva-bhadrapada' },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', element: 'Human', emoji: '🐍', path: '/about/uttara-bhadrapada' },
  { name: 'Revati', lord: 'Mercury', element: 'Divine', emoji: '🐟', path: '/about/revati' }
];

const Nakshatras = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Nakshatras
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Discover the 27 lunar mansions and their significance in Vedic astrology
            </p>
          </div>
        </div>
      </section>

      {/* Nakshatras Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {nakshatras.map((nakshatra, index) => (
              <Link key={nakshatra.name} to={nakshatra.path}>
                <Card className="text-center p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 hover:border-primary">
                  <CardContent className="p-4">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{nakshatra.emoji}</span>
                    </div>
                    <h3 className="font-semibold text-primary mb-1">{nakshatra.name}</h3>
                    <p className="text-sm text-muted-foreground mb-1">Lord: {nakshatra.lord}</p>
                    <p className="text-xs text-muted-foreground">{nakshatra.element}</p>
                    <div className="mt-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Learn More
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Nakshatras;