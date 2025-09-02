
import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignatureUpload from "@/components/signature/SignatureUpload";
import SignatureAnalysis from "@/components/signature/SignatureAnalysis";
import PresetSignatures from "@/components/signature/PresetSignatures";
import SignatureTips from "@/components/signature/SignatureTips";

const SignatureCalculator = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        analyzeSignature(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSignature = (imageUrl: string) => {
    setIsAnalyzing(true);
    
    // Simulate signature analysis with more realistic timing
    setTimeout(() => {
      const patterns = {
        size: Math.floor(Math.random() * 40) + 60, // 60-100 range
        clarity: Math.floor(Math.random() * 40) + 60,
        consistency: Math.floor(Math.random() * 40) + 60,
        flow: Math.floor(Math.random() * 40) + 60,
        pressure: Math.floor(Math.random() * 40) + 60,
        balance: Math.floor(Math.random() * 40) + 60
      };

      const overallScore = Math.floor(
        (patterns.size + patterns.clarity + patterns.consistency + 
         patterns.flow + patterns.pressure + patterns.balance) / 6
      );

      setAnalysis({
        patterns,
        overallScore,
        recommendation: getRecommendation(overallScore),
        shouldChange: overallScore < 75,
        presetMatch: Math.floor(Math.random() * 5) + 1
      });
      setIsAnalyzing(false);
    }, 3000); // Slightly longer for better UX
  };

  const getRecommendation = (score: number) => {
    if (score >= 90) return "Outstanding signature! Your writing shows exceptional balance, clarity, and professional appeal.";
    if (score >= 80) return "Excellent signature with strong characteristics. Minor refinements could enhance its impact.";
    if (score >= 70) return "Good signature foundation. Focus on consistency and flow for optimal results.";
    if (score >= 60) return "Your signature has potential. Consider improving clarity and maintaining consistent letter formation.";
    return "Significant improvement opportunities exist. Focus on developing a more consistent and readable style.";
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Signature Calculator
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Transform your signature with AI-powered analysis and expert recommendations. 
            Create a professional impression that reflects your unique personality.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700">
              <span className="text-purple-400 font-semibold">✨ AI Analysis</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700">
              <span className="text-blue-400 font-semibold">🎯 Expert Tips</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700">
              <span className="text-green-400 font-semibold">📈 Instant Results</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-16">
          <SignatureUpload 
            uploadedImage={uploadedImage}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
          />
          <SignatureAnalysis 
            analysis={analysis}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Preset Signatures Section */}
        <div className="mb-16">
          <PresetSignatures />
        </div>

        {/* Tips Section */}
        <div className="max-w-6xl mx-auto">
          <SignatureTips />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignatureCalculator;
