
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const FinancialConsultation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Financial Consultation</h1>
            <p className="text-xl opacity-90">Plan your finances based on astrological guidance</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Financial Consultation</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Financial stability is crucial for a secure future, and astrology can provide valuable insights into your wealth potential, investment timing, and money management. Our expert astrologers analyze your birth chart to guide you towards financial prosperity and security.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Through analysis of wealth houses (2nd and 11th), planetary periods, and beneficial combinations, we help you make informed financial decisions and overcome money-related challenges.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Consultation Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-4">Wealth Analysis</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Income potential assessment</li>
                    <li>• Wealth accumulation timing</li>
                    <li>• Multiple income sources</li>
                    <li>• Financial growth periods</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-4">Investment Guidance</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Best investment timing</li>
                    <li>• Stock market predictions</li>
                    <li>• Property investment advice</li>
                    <li>• Gold and precious metals</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-4">Business Finance</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Business profitability</li>
                    <li>• Partnership financial harmony</li>
                    <li>• Loan and debt management</li>
                    <li>• Expansion timing</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-4">Financial Remedies</h3>
                  <ul className="space-y-2 text-orange-800">
                    <li>• Debt relief solutions</li>
                    <li>• Poverty removal mantras</li>
                    <li>• Lakshmi puja remedies</li>
                    <li>• Wealth-attracting gemstones</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Wealth Houses in Astrology</h2>
              <div className="bg-emerald-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-emerald-900">2nd House - House of Wealth</h4>
                    <p className="text-emerald-800">Primary house for accumulated wealth, savings, and financial stability.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">11th House - House of Gains</h4>
                    <p className="text-emerald-800">Represents income, profits, gains from investments, and fulfillment of desires.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">9th House - House of Fortune</h4>
                    <p className="text-emerald-800">Indicates luck, fortune, inheritance, and unexpected financial gains.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">5th House - House of Speculation</h4>
                    <p className="text-emerald-800">Shows gains from speculation, lottery, gambling, and creative investments.</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Planets for Wealth and Prosperity</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-900 mb-2">Jupiter</h4>
                  <p className="text-yellow-800 text-sm">Planet of wealth, wisdom, and prosperity. Strong Jupiter brings abundance.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-900 mb-2">Venus</h4>
                  <p className="text-green-800 text-sm">Planet of luxury, comfort, and material pleasures. Enhances earning capacity.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Mercury</h4>
                  <p className="text-blue-800 text-sm">Planet of business, trade, and communication. Brings trading profits.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Problems We Address</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Continuous financial losses
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Inability to save money
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Investment failures
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Debt and loan burdens
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Business financial troubles
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Delayed payments and recoveries
                </li>
              </ul>
            </section>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Secure Your Financial Future</h3>
              <p className="mb-4">Get expert financial guidance based on astrological analysis</p>
              <Button className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
                💰 Get Financial Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default FinancialConsultation;
