
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Nadi = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/about-astrology" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to About Astrology
          </Link>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Nadi About</h1>
            <p className="text-xl opacity-90">Ancient palm leaf manuscripts containing your life's detailed predictions</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Reading Process</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-4">
                  <h3 className="font-bold text-gray-900">1. Thumb Impression</h3>
                  <p className="text-gray-700">Your thumb impression is matched with specific palm leaf categories</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900">2. Manuscript Matching</h3>
                  <p className="text-gray-700">We search through thousands of ancient palm leaves to find your specific leaf</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-bold text-gray-900">3. Identity Verification</h3>
                  <p className="text-gray-700">Verification through personal details mentioned in the manuscript</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Nadi Reveals</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-2">Past Life Information</h3>
                  <p className="text-blue-800">Detailed information about your previous births and karmic patterns</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-2">Present Life Analysis</h3>
                  <p className="text-green-800">Current life situations, challenges, and opportunities</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-2">Future Predictions</h3>
                  <p className="text-purple-800">Detailed predictions about future events and life milestones</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-2">Remedial Measures</h3>
                  <p className="text-orange-800">Specific remedies and solutions for life problems</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Three Nadi Systems</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">Nadi</th>
                      <th className="border border-gray-300 p-3 text-left">Origin</th>
                      <th className="border border-gray-300 p-3 text-left">Specialization</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Agastya Nadi</td>
                      <td className="border border-gray-300 p-3">Tamil Nadu</td>
                      <td className="border border-gray-300 p-3">General life predictions and spiritual guidance</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Bhrigu Nadi</td>
                      <td className="border border-gray-300 p-3">North India</td>
                      <td className="border border-gray-300 p-3">Detailed family lineage and professional guidance</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Kakabhusundi Nadi</td>
                      <td className="border border-gray-300 p-3">Kerala</td>
                      <td className="border border-gray-300 p-3">Mystical insights and advanced spiritual practices</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits of Nadi Reading</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Understand your life purpose and spiritual journey
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Get specific solutions for current life problems
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Learn about karmic debts and how to resolve them
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Receive guidance on marriage, career, and health
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                  Discover effective remedial measures and rituals
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
              <h3 className="text-2xl font-bold mb-4">Discover Your Nadi Palm Leaf</h3>
              <p className="mb-4">Find your ancient palm leaf manuscript with detailed life predictions</p>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                🍃 Get Nadi Reading
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Nadi;
