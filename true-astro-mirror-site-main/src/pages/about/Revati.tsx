import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Revati = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/nakshatras">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Nakshatras
              </Button>
            </Link>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4">
                Revati Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Wealth and Prosperity
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Revati Nakshatra, ruled by Mercury and symbolized by a fish or drum, represents completion, nourishment, and prosperity.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies nurturing qualities, protection, and the ability to guide others to safety. People born under Revati are naturally caring and protective.
                </p>
                
                <p>
                  Revati natives are known for their caring nature, wealth accumulation abilities, and talent for guiding others through life's journeys.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">🐟</span>
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
                  <span>16°40' to 30° Pisces</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Mercury</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Jupiter</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Pushan (Nurturer God)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Fish, Drum</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Revati natives are nurturing, wealthy, and possess strong protective instincts. They are natural caregivers and guides.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Mercury as ruling planet, they are intelligent, communicative, and have excellent business acumen. They excel in trade and commerce.
                </p>
                <p className="text-muted-foreground">
                  These individuals are compassionate, generous, and have the ability to create prosperity and share it with others around them.
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

export default Revati;