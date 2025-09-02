"use client";

import Link from "next/link";
import { ArrowLeft, Star, Users, Heart, Award, Phone, Mail } from "lucide-react";
import Header from "@/components/frontend/Header";
import Footer from "@/components/frontend/Footer";
import { Button } from "@/components/frontend/ui/button";
import { Card, CardContent } from "@/components/frontend/ui/card";

const OurTeamPage = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Pandit Rajesh Kumar",
      specialization: "Vedic Astrology & Kundli Analysis",
      experience: "15+ Years",
      languages: "Hindi, English, Sanskrit",
      rating: 4.9,
      consultations: "50,000+",
      bio: "Expert in Vedic astrology with deep knowledge of ancient scriptures. Specializes in marriage compatibility, career guidance, and spiritual counseling."
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Numerology & Tarot Reading",
      experience: "12+ Years",
      languages: "Hindi, English, Gujarati",
      rating: 4.8,
      consultations: "35,000+",
      bio: "Certified numerologist and tarot expert helping people discover their life purpose through numbers and cards. Expert in relationship and career guidance."
    },
    {
      id: 3,
      name: "Acharya Vikash Joshi",
      specialization: "KP Astrology & Palmistry",
      experience: "20+ Years",
      languages: "Hindi, English, Bengali",
      rating: 4.9,
      consultations: "75,000+",
      bio: "Renowned KP astrology expert with exceptional palmistry skills. Known for accurate predictions and practical remedies for life challenges."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl p-8 text-white mb-8 text-center">
            <Users className="w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-4xl font-bold mb-4">Meet Our Expert Astrologers</h1>
            <p className="text-xl opacity-90">Experienced professionals dedicated to guiding you on your life journey</p>
          </div>
          
          <div className="grid lg:grid-cols-1 gap-8 mb-12">
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Why Choose Our Astrologers?</h2>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <Star className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Verified Experts</h3>
                    <p className="text-sm text-gray-600">All our astrologers are thoroughly verified with proven track records</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <Heart className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Personalized Care</h3>
                    <p className="text-sm text-gray-600">Each consultation is tailored to your specific needs</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Trusted by Thousands</h3>
                    <p className="text-sm text-gray-600">Over 100,000 satisfied customers trust our services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                        <p className="text-indigo-600 font-medium mb-2">{member.specialization}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            {member.rating}
                          </span>
                          <span>{member.experience}</span>
                          <span>{member.consultations} consultations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">Languages</h4>
                      <p className="text-sm text-gray-600">{member.languages}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to Connect with an Expert?</h2>
            <p className="text-gray-600 mb-6">Get personalized astrological guidance from our verified experts</p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-orange-600 hover:bg-orange-700 px-8 py-3">
                Browse All Astrologers
              </Button>
              <Button variant="outline" className="px-8 py-3">
                Book Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OurTeamPage;