import React from 'react';
import { ArrowLeft, Star, User, Heart, Briefcase, DollarSign, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Ashwini = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
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
              <h1 className="text-4xl font-bold text-orange-800 mb-4">
                Ashwini About
              </h1>
              <h2 className="text-2xl text-purple-600 mb-6">
                Unveiling the Mysteries of Ashwini Nakshatra
              </h2>
              
              <div className="prose text-gray-700 max-w-none">
                <p className="mb-4">
                  Ashwini's name is derived from 'Ashva' which means horse. Ashvin means one who owns horses. This 
                  sign is ruled by Ashwini Kumars and they are twins. Hence, this sign signifies twins.
                </p>
                
                <p className="mb-4">
                  Generally, horses are representative of power and stamina. Ashwini Kumars who are the God of the 
                  Nakshatra are great surgeons, can do medical marvels, can restore health, beauty and vision as was 
                  illustrated in different ancient stories especially in hermit Chavan. They have bestowed health to all 
                  those who invoke their grace for their healing.
                </p>
                
                <p>
                  In Rig Veda it is said that the Ashwinis can bring rain during a drought. It also says that once Ashwinis 
                  dug a hole in the desert and it became a well. This perhaps indicates that problems can be overcome 
                  by starting the efforts when planets, especially the Moon are well placed in Ashwini Nakshatra.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
                  <div className="w-60 h-60 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-6xl">🐎</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-orange-500 text-white rounded-full p-3">
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
                <CardTitle className="text-orange-600">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>0° Aries to 13°20' Aries</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ruling planet:</span>
                  <span>Ketu</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sign Lord:</span>
                  <span>Mars</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Deity:</span>
                  <span>The Ashwini Kumars</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Symbol:</span>
                  <span>Head of a horse</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Natives born with Moon in Ashwini nakshatra are generally beautiful in appearance. They love to be adorned in good 
                  jewelry and clothes. They are sharp-witted, accomplished and unperturbed. Usually they have a calm 
                  temperament.
                </p>
                <p className="text-gray-700 mb-4">
                  Ketu the lord of the Nakshatra is Mars like as per astrological classics. Further, the nakshatra is situated in Aries sign. 
                  Hence, natives of Ashwini may have lots of characteristics of Mars in them.
                </p>
                <p className="text-gray-700">
                  The native may be courageous, bold and also be fond of travelling. The natives born in Ashwini Nakshatra are also 
                  beautiful among people. Ashwini natives are very swift and always ready for action. Natives of this 
                  Nakshatra are generally confident, optimistic courageous and passionate. They are born leaders and relish sports and 
                  physical challenges.
                </p>
                <p className="text-gray-700 mt-4">
                  However, negatively they may be impatient, aggressive, impulsive and at times of short-temper.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Life Aspects */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Briefcase className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Career</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Natives having influence of Ashwini can become good doctors as well as surgeons as they are born with the grace of 
                  Ashwini Kumar's. Ashwini natives are almost childlike and very innocent in their behaviour. However, Ashwini born 
                  natives have lots of confidence. But, they can have an ego as well.
                </p>
                <p className="text-gray-700 text-sm mt-3">
                  The natives of Ashwini Nakshatra are born leaders. No doubt this is the Nakshatra in which Sun is exalted. The natives 
                  of this Nakshatra may make great and compassionate leaders. They are compassionate and have genuine concern for 
                  people who work with them.
                </p>
                <p className="text-gray-700 text-sm mt-3">
                  However, they fail miserably if they have to follow others. However, one major drawback is that they can be very 
                  impatient.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  The most important quality in Ashwini Nakshatra is that they have the ability to respect other people's opinions and 
                  choices. They are warm, passionate, adventurous and ready to help everyone who approaches them for help and 
                  support.
                </p>
                <p className="text-gray-700 text-sm mt-3">
                  The native can even fight to protect his/her love. The natives of the Ashwini Nakshatra may be flirtatious by nature. 
                  The female more inclined to have new and varied experiences in relationships. They start getting bored in any 
                  relationship which becomes stale and stagnant.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Finances</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Ashwini natives like to amass wealth and power by attracting admirers and followers. Generally, Ashwini Nakshatra is 
                  seen for wealth, health, beauty, power, fame and prestige. If good planets are placed in Ashwini Nakshatra then the 
                  native enjoys financial security under the influence of this planet or have the potential of earning money.
                </p>
                <p className="text-gray-700 text-sm mt-3">
                  They have lots of creativity which can help them take advantage of all situations which come under their domain. 
                  However, they may lack the patience to make it really big financially. They may miss good opportunities.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Ashwini rules the head of Mahadeva, they may be prone to diseases of the head. Ashwini rules the knees of the Lord 
                  Vishnu. Hence, the natives may have issues related to knees. The natives of Ashwini may be prone to fever, windy 
                  troubles, insomnia, mental disturbances, epilepsy and headaches.
                </p>
                <p className="text-gray-700 text-sm mt-3">
                  The natives may have a liking of adventure sports or the like. They take great risks to entertain themselves. At times 
                  this may lead to accidents and can cause major mishaps. It is necessary for them to take precaution and not to risk 
                  their life just for the sake of pleasure.
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

export default Ashwini;