import React from 'react';
import { ArrowLeft, Star, Heart, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Chitra = () => {
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
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4">
                Chitra Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Beauty and Creation
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Chitra Nakshatra, ruled by Mars and symbolized by a bright jewel or pearl, represents beauty, creativity, and architectural skills. The ruling deity is Tvashtar, the celestial architect.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies artistic vision, construction abilities, and the power to create beautiful things. People born under Chitra are natural designers and creators.
                </p>
                
                <p>
                  Chitra natives are known for their aesthetic sense, attention to detail, and ability to build or design things that are both beautiful and functional.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">💎</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-3">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Major Details */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Major Details</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-secondary">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>23°20' Virgo to 6°40' Libra</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Mars</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mercury/Venus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Tvashtar (Celestial Architect)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Bright Jewel, Pearl</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Chitra natives are artistic, creative, and possess excellent design skills. They have natural aesthetic sense and attention to detail.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Mars as ruling planet, they are dynamic, energetic, and possess the drive to turn their creative visions into reality.
                </p>
                <p className="text-muted-foreground">
                  These individuals are perfectionists who strive for beauty and excellence in everything they create or touch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Life Aspects */}
      <section className="py-16 bg-muted">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Career</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Chitra natives excel in architecture, design, fashion, and visual arts. They make excellent architects, jewelers, and creative professionals due to their aesthetic sense and eye for beauty.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Chitra individuals seek beautiful and harmonious relationships. They are attracted to partners who share their aesthetic values and appreciate beauty in all its forms.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Finances</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Financial prosperity comes through creative and design-related ventures. They should invest in art, jewelry, and beauty industries while focusing on quality over quantity.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Chitra natives should maintain their physical appearance and health through regular exercise and proper nutrition. They benefit from activities that combine fitness with aesthetics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Chitra;