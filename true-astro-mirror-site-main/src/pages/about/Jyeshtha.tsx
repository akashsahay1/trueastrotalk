import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Jyeshtha = () => {
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
                Jyeshtha Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Seniority and Protection
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Jyeshtha Nakshatra, ruled by Mercury and symbolized by an umbrella or earring, represents protection, authority, and responsibility.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies leadership, wisdom, and the ability to take care of others. People born under Jyeshtha are naturally protective and responsible.
                </p>
                
                <p>
                  Jyeshtha natives are known for their maturity, leadership qualities, and ability to guide and protect those under their care.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">🌙</span>
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
                  <span>16°40' to 30° Scorpio</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Mercury</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mars</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Indra (King of Gods)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Umbrella, Earring</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Jyeshtha natives are mature, responsible, and possess natural leadership qualities. They are protective of their family and community.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Mercury as ruling planet, they are intelligent, communicative, and possess strong analytical abilities. They are natural counselors.
                </p>
                <p className="text-muted-foreground">
                  These individuals are authoritative, wise, and have the ability to take charge in difficult situations and guide others.
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

export default Jyeshtha;