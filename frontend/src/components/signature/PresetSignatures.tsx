
import React from "react";
import { Download, Star, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PresetSignature {
  id: number;
  name: string;
  image: string;
  score: number;
  style: string;
}

const PresetSignatures: React.FC = () => {
  const presetSignatures: PresetSignature[] = [
    { id: 1, name: "Classic Elegance", image: "/placeholder.svg", score: 92, style: "Timeless & Professional" },
    { id: 2, name: "Modern Flow", image: "/placeholder.svg", score: 88, style: "Contemporary & Clean" },
    { id: 3, name: "Bold Statement", image: "/placeholder.svg", score: 95, style: "Confident & Strong" },
    { id: 4, name: "Elegant Script", image: "/placeholder.svg", score: 89, style: "Refined & Artistic" },
    { id: 5, name: "Minimalist", image: "/placeholder.svg", score: 84, style: "Simple & Effective" },
    { id: 6, name: "Executive Style", image: "/placeholder.svg", score: 91, style: "Corporate & Polished" }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          Premium Signature Styles
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Discover professionally crafted signature styles that make a lasting impression
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presetSignatures.map((preset) => (
          <Card 
            key={preset.id} 
            className="bg-slate-800/60 border-slate-700 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer group backdrop-blur-sm hover:scale-105 hover:shadow-2xl"
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Signature Preview */}
                <div className="aspect-[3/2] bg-gradient-to-br from-white to-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="text-slate-700 text-2xl font-serif italic font-bold relative z-10">
                    {preset.name}
                  </div>
                </div>

                {/* Style Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">{preset.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Badge 
                        variant={preset.score >= 90 ? "default" : "secondary"} 
                        className="text-xs font-bold"
                      >
                        {preset.score}/100
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm">{preset.style}</p>
                  
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 group-hover:shadow-lg transition-all duration-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Style
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PresetSignatures;
