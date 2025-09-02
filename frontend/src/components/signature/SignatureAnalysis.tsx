
import React from "react";
import { Star, CheckCircle, AlertCircle, Info, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AnalysisData {
  patterns: {
    size: number;
    clarity: number;
    consistency: number;
    flow: number;
    pressure: number;
    balance: number;
  };
  overallScore: number;
  recommendation: string;
  shouldChange: boolean;
  presetMatch: number;
}

interface SignatureAnalysisProps {
  analysis: AnalysisData | null;
  isAnalyzing: boolean;
}

const SignatureAnalysis: React.FC<SignatureAnalysisProps> = ({
  analysis,
  isAnalyzing,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const patternNames = {
    size: "Size Consistency",
    clarity: "Clarity & Readability",
    consistency: "Overall Consistency", 
    flow: "Natural Flow",
    pressure: "Pressure Control",
    balance: "Visual Balance"
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Signature Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="relative mx-auto mb-6 w-16 h-16">
              <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-white text-lg mb-2">Analyzing your signature...</p>
            <p className="text-slate-400 text-sm">This may take a few seconds</p>
          </div>
        ) : analysis ? (
          <div className="space-y-8">
            {/* Overall Score Section */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`text-6xl font-bold mb-3 ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                  <span className="text-2xl text-slate-400">/100</span>
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(analysis.overallScore)}
                  className="absolute -top-2 -right-2"
                >
                  {analysis.overallScore >= 90 ? "Excellent" : 
                   analysis.overallScore >= 80 ? "Good" :
                   analysis.overallScore >= 60 ? "Average" : "Needs Work"}
                </Badge>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                {analysis.recommendation}
              </p>
            </div>

            {/* Pattern Analysis Grid */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Detailed Pattern Analysis
              </h4>
              <div className="grid gap-4">
                {Object.entries(analysis.patterns).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">
                        {patternNames[key as keyof typeof patternNames]}
                      </span>
                      <Badge variant="outline" className={`${getScoreColor(Number(value))} border-current`}>
                        {Number(value)}/100
                      </Badge>
                    </div>
                    <Progress value={Number(value)} className="h-3" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Card */}
            <div className={`flex items-start gap-4 p-6 rounded-xl ${
              analysis.shouldChange 
                ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/30" 
                : "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/30"
            }`}>
              {analysis.shouldChange ? (
                <AlertCircle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
              ) : (
                <Award className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              )}
              <div className="space-y-2">
                <h5 className="text-white font-semibold text-lg">
                  {analysis.shouldChange ? "Improvement Opportunities" : "Excellent Signature!"}
                </h5>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.shouldChange 
                    ? "Your signature shows potential for improvement. Consider working on consistency and flow for better legibility and professional appearance." 
                    : "Your signature demonstrates excellent balance, clarity, and consistency. It projects professionalism and confidence."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Info className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-lg mb-2">Upload a signature image</p>
            <p className="text-sm">Get detailed analysis and personalized recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignatureAnalysis;
