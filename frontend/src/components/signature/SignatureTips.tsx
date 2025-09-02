
import React from "react";
import { Lightbulb, CheckCircle, XCircle, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SignatureTips: React.FC = () => {
  const goodPractices = [
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Maintain consistent letter size and spacing" },
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Use clear and readable letters" },
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Create a balanced horizontal flow" },
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Apply appropriate pressure and thickness" },
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Develop a personal and unique style" },
    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, text: "Practice regularly for muscle memory" }
  ];

  const avoidPractices = [
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Overly complicated flourishes and decorations" },
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Inconsistent letter heights and widths" },
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Too much slant or irregular angles" },
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Extremely small or oversized signatures" },
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Illegible or messy appearance" },
    { icon: <XCircle className="w-5 h-5 text-red-400" />, text: "Changing style frequently" }
  ];

  const expertTips = [
    "Practice on lined paper first to maintain consistent baseline",
    "Study famous signatures for inspiration but keep yours unique",
    "Your signature should be reproducible under different conditions",
    "Consider the context - formal documents vs casual notes",
    "A good signature balances security with legibility"
  ];

  return (
    <Card className="bg-slate-800/60 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          Master Your Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Good Practices */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Best Practices
            </h4>
            <div className="space-y-3">
              {goodPractices.map((practice, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                  {practice.icon}
                  <span className="text-slate-300 text-sm leading-relaxed">{practice.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Things to Avoid */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Common Mistakes
            </h4>
            <div className="space-y-3">
              {avoidPractices.map((practice, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                  {practice.icon}
                  <span className="text-slate-300 text-sm leading-relaxed">{practice.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expert Tips */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Expert Tips
          </h4>
          <div className="grid gap-3">
            {expertTips.map((tip, index) => (
              <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30">
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="font-semibold text-purple-400">Pro Tip #{index + 1}:</span> {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureTips;
