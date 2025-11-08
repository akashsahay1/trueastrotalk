import React from 'react';
import { ArrowLeft, Star, Heart, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Punarvasu = () => {
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
                Punarvasu Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Renewal and Restoration
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Punarvasu Nakshatra, ruled by Jupiter and symbolized by a quiver of arrows or a house, represents return, renewal, and restoration. The ruling deity is Aditi, the mother of gods.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies the power of renewal, second chances, and the ability to bounce back from setbacks. People born under Punarvasu have remarkable resilience.
                </p>
                
                <p>
                  Punarvasu natives are known for their optimistic nature, philosophical outlook, and ability to inspire hope in others during difficult times.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">🏹</span>
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
                  <span>20° Gemini to 3°20' Cancer</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Jupiter</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mercury/Moon</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Aditi (Mother of Gods)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Quiver of Arrows, House</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Punarvasu natives are optimistic, resilient, and possess the ability to bounce back from any setback. They inspire hope in others.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Jupiter as ruling planet, they are wise, philosophical, and possess strong spiritual inclinations and teaching abilities.
                </p>
                <p className="text-muted-foreground">
                  These individuals are generous, kind-hearted, and have the ability to provide emotional and material support to others.
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
                  Punarvasu natives excel in teaching, counseling, spiritual guidance, and hospitality. They make excellent teachers, motivational speakers, and spiritual leaders due to their optimistic nature.
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
                  Punarvasu individuals are loyal, caring, and supportive partners. They bring stability and hope to relationships and help their loved ones overcome difficulties.
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
                  Financial stability comes through patience and persistence. Punarvasu natives should focus on long-term investments and avoid get-rich-quick schemes for lasting prosperity.
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
                  Generally good health with strong recuperative powers. They should maintain a balanced diet and regular exercise routine to support their naturally robust constitution.
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

export default Punarvasu;