import React from 'react';
import { ArrowLeft, Star, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NakshatrasGeneral = () => {
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
              About Nakshatras
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Understanding the 27 Lunar Mansions and Their Profound Impact on Human Life
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Star className="w-6 h-6" />
                What are Nakshatras?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nakshatras, also known as lunar mansions or lunar constellations, are a fundamental concept in Vedic astrology. 
                The word "Nakshatra" is derived from two Sanskrit words: "Naksha" meaning map and "Tra" meaning guard, 
                literally translating to "that which guards or protects."
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These 27 divisions of the sky represent the Moon's journey through the zodiac in approximately 27.3 days. 
                Each Nakshatra spans 13°20' of the zodiac and has its unique characteristics, ruling deity, 
                planetary lord, and influence on human personality and destiny.
              </p>
            </CardContent>
          </Card>

          {/* Historical Significance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Moon className="w-6 h-6" />
                Historical Significance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Nakshatra system is one of the oldest astrological systems in the world, dating back over 5,000 years. 
                Ancient Indian astronomers and astrologers developed this sophisticated system by observing the Moon's 
                movement against the backdrop of fixed stars.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This system was mentioned in ancient texts like the Rigveda, Atharvaveda, and various Puranas, 
                making it an integral part of Indian culture, spirituality, and daily life for millennia.
              </p>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sun className="w-6 h-6" />
                Classification of Nakshatras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary mb-3">By Nature (Gana)</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Deva (Divine):</strong> 9 Nakshatras with divine qualities</li>
                    <li><strong>Manushya (Human):</strong> 9 Nakshatras with human traits</li>
                    <li><strong>Rakshasa (Demon):</strong> 9 Nakshatras with fierce qualities</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-3">By Gender</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Masculine:</strong> Strong, active, outgoing nature</li>
                    <li><strong>Feminine:</strong> Gentle, receptive, nurturing nature</li>
                    <li><strong>Neutral:</strong> Balanced characteristics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-primary">Applications in Vedic Astrology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary mb-3">Personal Analysis</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Personality traits and characteristics</li>
                    <li>• Career and profession guidance</li>
                    <li>• Health and wellness insights</li>
                    <li>• Relationship compatibility</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-3">Timing & Muhurta</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Auspicious timing for events</li>
                    <li>• Marriage and ceremony planning</li>
                    <li>• Business and investment decisions</li>
                    <li>• Travel and relocation timing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-primary mb-4">
                  Explore Individual Nakshatras
                </h3>
                <p className="text-muted-foreground mb-6">
                  Dive deeper into each of the 27 Nakshatras to understand their unique characteristics, 
                  ruling deities, and influence on your life.
                </p>
                <Button asChild size="lg">
                  <Link to="/nakshatras">
                    Explore All 27 Nakshatras
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NakshatrasGeneral;