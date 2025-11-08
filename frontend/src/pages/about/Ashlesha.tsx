import React from 'react';
import { ArrowLeft, Star, Heart, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Ashlesha = () => {
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
                Ashlesha Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Mystical Power and Wisdom
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Ashlesha Nakshatra, ruled by Mercury and symbolized by a coiled serpent, represents mystical power, wisdom, and transformation. The ruling deity is the Nagas (serpent gods).
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies intuition, psychic abilities, and the power to penetrate deep mysteries. People born under Ashlesha possess intense mental capabilities.
                </p>
                
                <p>
                  Ashlesha natives are known for their sharp intellect, ability to understand hidden meanings, and power to influence others through their words.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">🐍</span>
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
                  <span>16°40' to 30° Cancer</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Mercury</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Moon</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Nagas (Serpent Gods)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Coiled Serpent</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Ashlesha natives possess deep intuition, mystical abilities, and sharp intelligence. They can understand hidden meanings and motivations.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Mercury as ruling planet, they are excellent communicators with the ability to influence others through their words and ideas.
                </p>
                <p className="text-muted-foreground">
                  These individuals are secretive, strategic, and possess the ability to transform themselves and others through their profound insights.
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
                  Ashlesha natives excel in psychology, healing, research, and mystical sciences. They make excellent therapists, investigators, and spiritual counselors due to their intuitive abilities.
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
                  Ashlesha individuals are deeply protective and loyal to their loved ones. They form intense emotional bonds and need partners who can understand their complex nature.
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
                  Financial intuition is strong, but they should avoid secretive deals. Success comes through using their psychological insight in business and investment decisions.
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
                  Need to manage stress and emotional intensity. Regular meditation and energy healing practices help maintain physical and mental balance.
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

export default Ashlesha;