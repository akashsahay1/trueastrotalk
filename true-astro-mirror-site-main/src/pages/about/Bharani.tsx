import React from 'react';
import { ArrowLeft, Star, User, Heart, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Bharani = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-pink-50 py-16">
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
              <h1 className="text-4xl font-bold text-red-800 mb-4">
                Bharani Nakshatra
              </h1>
              <h2 className="text-2xl text-purple-600 mb-6">
                The Star of Restraint and Transformation
              </h2>
              
              <div className="prose text-gray-700 max-w-none">
                <p className="mb-4">
                  Bharani Nakshatra, ruled by Venus and symbolized by the yoni (female reproductive organ), represents creativity, fertility, and the power of transformation. The ruling deity is Yama, the god of death and dharma.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies the cycle of life and death, representing the transformative power that brings about change and growth. People born under Bharani are often blessed with artistic talents and a deep understanding of life's mysteries.
                </p>
                
                <p>
                  Bharani natives possess strong willpower and determination. They have the ability to overcome obstacles and transform challenges into opportunities for growth and success.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-red-200 to-pink-200 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-6xl">🌸</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-3">
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
          <h2 className="text-3xl font-bold text-center mb-12 text-purple-800">Major Details</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>13°20' Aries to 26°40' Aries</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Venus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mars</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Yama (God of Death)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Yoni (Female reproductive organ)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Bharani natives are known for their strong determination and transformative abilities. They possess deep wisdom and understanding of life's cycles.
                </p>
                <p className="text-gray-700 mb-4">
                  With Venus as the ruling planet, they have natural artistic talents and appreciation for beauty. They are creative individuals who can bring new ideas to life.
                </p>
                <p className="text-gray-700">
                  These individuals are honest, straightforward, and possess strong moral values. They have the courage to face difficult situations and emerge stronger.
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

export default Bharani;