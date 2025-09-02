"use client";

import Link from "next/link";
import { ArrowLeft, Stars, Globe, Clock, BookOpen } from "lucide-react";
import Header from "@/components/frontend/Header";
import Footer from "@/components/frontend/Footer";
import { Button } from "@/components/frontend/ui/button";
import { Card, CardContent } from "@/components/frontend/ui/card";

const AboutAstrologyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl p-8 text-white mb-8">
            <Stars className="w-16 h-16 mb-4" />
            <h1 className="text-4xl font-bold mb-4">About Astrology</h1>
            <p className="text-xl opacity-90">Understanding the ancient science of celestial influences on human life</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">What is Astrology?</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Astrology is the ancient study of celestial bodies and their influence on human affairs and terrestrial events. It's based on the belief that the positions and movements of celestial objects at the time of birth can provide insights into personality, behavior patterns, and life events.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    This time-honored practice has been developed and refined over thousands of years across different cultures, with each civilization contributing unique perspectives and techniques to our understanding of cosmic influences.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Modern astrology combines traditional wisdom with contemporary psychological insights, offering a holistic approach to understanding human nature and potential life paths.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    History of Astrology
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Ancient Origins (3000+ BCE)</h4>
                      <p className="text-sm text-indigo-700">Babylonians created the first systematic astrological records and zodiac system</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Greek Influence (500 BCE - 500 CE)</h4>
                      <p className="text-sm text-purple-700">Greeks refined astrology with mathematical precision and philosophical depth</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Islamic Golden Age (800-1200 CE)</h4>
                      <p className="text-sm text-blue-700">Islamic scholars preserved and advanced astrological knowledge</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-teal-800 mb-2">Renaissance Revival (1400-1600 CE)</h4>
                      <p className="text-sm text-teal-700">European renaissance brought renewed interest in astrological studies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Core Components</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Zodiac Signs</h4>
                        <p className="text-sm text-gray-600">12 astrological signs representing different personality archetypes</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Planets</h4>
                        <p className="text-sm text-gray-600">Celestial bodies representing different life energies and influences</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Houses</h4>
                        <p className="text-sm text-gray-600">12 life areas covering all aspects of human experience</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Aspects</h4>
                        <p className="text-sm text-gray-600">Angular relationships between planets affecting their influence</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-600" />
                    Types of Astrology
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="font-semibold text-blue-800 mb-1">Western Astrology</h4>
                      <p className="text-xs text-blue-700">Based on tropical zodiac, focuses on Sun sign and psychological traits</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <h4 className="font-semibold text-orange-800 mb-1">Vedic Astrology</h4>
                      <p className="text-xs text-orange-700">Indian system using sidereal zodiac with emphasis on karma and dharma</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <h4 className="font-semibold text-red-800 mb-1">Chinese Astrology</h4>
                      <p className="text-xs text-red-700">Based on 12-year cycles with animal zodiac and five elements</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="font-semibold text-green-800 mb-1">Mayan Astrology</h4>
                      <p className="text-xs text-green-700">Complex calendar system with 20 day signs and 13 galactic numbers</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <h4 className="font-semibold text-purple-800 mb-1">Celtic Astrology</h4>
                      <p className="text-xs text-purple-700">Tree zodiac based on ancient Celtic lunar calendar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Branches of Astrology</h3>
                  <div className="space-y-3 text-sm">
                    <p><strong>Natal Astrology:</strong> Analysis of birth charts for personality insights</p>
                    <p><strong>Horary Astrology:</strong> Answering specific questions using chart of the moment</p>
                    <p><strong>Electional Astrology:</strong> Finding auspicious timing for important events</p>
                    <p><strong>Medical Astrology:</strong> Health analysis through astrological indicators</p>
                    <p><strong>Mundane Astrology:</strong> World events and political predictions</p>
                    <p><strong>Financial Astrology:</strong> Market trends and economic forecasting</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                    What Astrology Can Reveal
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-green-500 pl-3">
                      <h4 className="font-semibold">Personality Traits</h4>
                      <p className="text-sm text-gray-600">Core characteristics, strengths, and areas for growth</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-semibold">Life Patterns</h4>
                      <p className="text-sm text-gray-600">Recurring themes and cycles in personal development</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-3">
                      <h4 className="font-semibold">Relationship Compatibility</h4>
                      <p className="text-sm text-gray-600">Understanding dynamics with others through chart comparison</p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-3">
                      <h4 className="font-semibold">Career Guidance</h4>
                      <p className="text-sm text-gray-600">Natural talents and suitable professional paths</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-3">
                      <h4 className="font-semibold">Timing of Events</h4>
                      <p className="text-sm text-gray-600">Favorable periods for major life decisions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">Explore Your Cosmic Blueprint</h3>
            <p className="text-gray-600 mb-6">Discover how the stars and planets influence your unique life journey through personalized astrological guidance</p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3">
                Get Your Birth Chart
              </Button>
              <Button variant="outline" className="px-8 py-3">
                Learn More About Astrology
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutAstrologyPage;