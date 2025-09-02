import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Krittika = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-orange-50 py-16">
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
              <h1 className="text-4xl font-bold text-yellow-800 mb-4">
                Krittika Nakshatra
              </h1>
              <h2 className="text-2xl text-purple-600 mb-6">
                The Star of Fire and Purification
              </h2>
              
              <div className="prose text-gray-700 max-w-none">
                <p className="mb-4">
                  Krittika Nakshatra, ruled by the Sun and symbolized by a razor or flame, represents purification, cutting through illusions, and spiritual awakening. The ruling deity is Agni, the god of fire.
                </p>
                
                <p className="mb-4">
                  This nakshatra embodies the power of fire to purify and transform. People born under Krittika have a natural ability to see through deceptions and get to the truth of matters.
                </p>
                
                <p>
                  Krittika natives are known for their sharp intellect, leadership qualities, and ability to inspire others. They have a strong sense of justice and are not afraid to fight for what is right.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-6xl">🔥</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-yellow-500 text-white rounded-full p-3">
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
                <CardTitle className="text-yellow-600">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>26°40' Aries to 10° Taurus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Sun</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mars/Venus</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>Agni (God of Fire)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Razor, Flame</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Krittika natives are natural leaders with sharp intellect and strong determination. They have the ability to cut through confusion and see situations clearly.
                </p>
                <p className="text-gray-700 mb-4">
                  With the Sun as ruling planet, they possess strong willpower and leadership qualities. They are confident individuals who can inspire and motivate others.
                </p>
                <p className="text-gray-700">
                  These individuals have a strong sense of justice and righteousness. They are not afraid to speak the truth and fight against injustice.
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

export default Krittika;