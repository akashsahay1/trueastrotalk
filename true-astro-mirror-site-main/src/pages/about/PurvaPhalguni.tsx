import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PurvaPhalguni = () => {
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
                Purva Phalguni Nakshatra
              </h1>
              <h2 className="text-2xl text-secondary mb-6">
                The Star of Pleasure and Creativity
              </h2>
              
              <div className="prose text-muted-foreground max-w-none">
                <p className="mb-4">
                  Purva Phalguni Nakshatra, ruled by Venus and symbolized by a swinging hammock or front legs of a bed, represents pleasure, creativity, and relaxation. The ruling deity is Bhaga, god of delight.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies artistic talents, love for beauty, and the enjoyment of life's pleasures. People born under Purva Phalguni are naturally creative and charismatic.
                </p>
                
                <p>
                  Purva Phalguni natives are known for their magnetic personality, artistic abilities, and capacity to bring joy and beauty into the lives of others.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-6xl">🎨</span>
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
                  <span>13°20' to 26°40' Leo</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Venus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Sun</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Bhaga (God of Delight)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Swinging Hammock, Front Legs of Bed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-accent">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Purva Phalguni natives are creative, artistic, and possess natural charm and magnetism. They love beauty and luxury.
                </p>
                <p className="text-muted-foreground mb-4">
                  With Venus as ruling planet, they have strong aesthetic sense, romantic nature, and the ability to create harmony and beauty.
                </p>
                <p className="text-muted-foreground">
                  These individuals are generous, friendly, and have the capacity to enjoy life while bringing pleasure and joy to others.
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

export default PurvaPhalguni;