import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const AstrologerRegistration = () => {
  const [showOtpPage, setShowOtpPage] = React.useState(true);
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+91');
  const [termsOtp, setTermsOtp] = React.useState(false);
  const [profilePic, setProfilePic] = React.useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = React.useState<string[]>([]);
  
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    gender: '',
    country: 'india',
    dob: '',
    experience: '',
    address: '',
    longBio: '',
    terms: false
  });

  const specializations = [
    'Vedic Astrology', 'Tarot Reading', 'Numerology', 'Face Reading', 'Palmistry',
    'Vastu Shastra', 'Life Coach', 'Lal Kitab', 'Prashna Astrology', 'Nadi Astrology',
    'Tarot Coach', 'Name Numerology', 'Psychology', 'Kundali Reading', 'Vedic Numerology'
  ];

  const languages = [
    'Hindi', 'English', 'Bengali', 'Gujarati', 'Marathi', 'Tamil', 'Telugu',
    'Punjabi', 'Kannada', 'Malayalam', 'Sindhi', 'Bhojpuri', 'Assamese', 'Sanskrit', 'Nepali'
  ];

  const proceedToRegistration = () => {
    if (!mobileNumber.trim()) {
      alert('Please enter your mobile number');
      return;
    }
    
    if (!termsOtp) {
      alert('Please accept the terms and conditions');
      return;
    }
    
    setShowOtpPage(false);
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecs(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLangs(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePic(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSpecs.length === 0) {
      alert('Please select at least one specialization');
      return;
    }
    
    if (selectedLangs.length === 0) {
      alert('Please select at least one language');
      return;
    }
    
    alert('Registration submitted successfully! You will receive a confirmation email shortly.');
    
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      gender: '',
      country: 'india',
      dob: '',
      experience: '',
      address: '',
      longBio: '',
      terms: false
    });
    setSelectedSpecs([]);
    setSelectedLangs([]);
    setProfilePic(null);
    setShowOtpPage(true);
    setMobileNumber('');
    setTermsOtp(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Floating Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[10%] text-2xl opacity-10 animate-pulse">⭐</div>
        <div className="absolute top-[20%] right-[10%] text-lg opacity-10 animate-pulse delay-300">🌙</div>
        <div className="absolute top-[60%] left-[5%] text-xl opacity-10 animate-pulse delay-700">✨</div>
        <div className="absolute bottom-[20%] right-[15%] text-base opacity-10 animate-pulse delay-1000">🔮</div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden my-5">
        {showOtpPage ? (
          /* OTP Page */
          <div className="p-8 md:p-16 text-center min-h-[600px]">
            {/* Brand Section */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-4xl md:text-5xl shadow-lg">
                  🕉️
                </div>
                <div className="text-center md:text-left">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <span className="text-white text-2xl">🕉</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold text-red-600" style={{ fontFamily: 'serif' }}>
                    श्री गणेशाय नमः
                  </h1>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Astrologer Registration</h2>
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                  ✓
                </div>
              </div>
            </div>

            {/* Mobile Section */}
            <div className="max-w-md mx-auto">
              <Label className="block text-lg font-semibold text-gray-800 mb-4 text-left">
                Mobile Number*
              </Label>
              <div className="flex gap-3 mb-6">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-32 bg-gray-50 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">🇮🇳 +91 India</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1 USA</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44 UK</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="Enter your mobile no."
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="flex-1 border-2 bg-gray-50 focus:bg-white"
                />
              </div>
              
              <div className="flex items-start gap-3 mb-6 text-left">
                <Checkbox
                  id="termsOtp"
                  checked={termsOtp}
                  onCheckedChange={(checked) => setTermsOtp(checked === true)}
                />
                <Label htmlFor="termsOtp" className="text-sm text-gray-600">
                  I agree to the <span className="text-blue-600 underline cursor-pointer">Terms And Conditions</span>*
                </Label>
              </div>
              
              <Button
                onClick={proceedToRegistration}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                GET OTP ➔
              </Button>
            </div>

            {/* Description Section */}
            <div className="mt-16 max-w-4xl mx-auto text-left">
              <h3 className="text-yellow-600 text-xl font-bold mb-6 text-center underline">
                true Astrotalk के साथ जुड़ें – एक Verified ज्योतिषी के रूप में अपनी पहचान बनाएं!
              </h3>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  true Astrotalk के Verified ज्योतिषी बनें — अपने ज्ञान से लोगों की मदद करें और सम्मान पाएं
                </p>

                <p>
                  अगर आप एक अनुभवी, प्रमाणिक और समर्पित ज्योतिषाचार्य हैं और चाहते हैं कि आपका ज्ञान ज्यादा से ज्यादा लोगों तक पहुँचे, तो true Astrotalk आपके लिए एक शानदार मंच है। आज के डिजिटल युग में लोग ऑनलाइन ज्योतिष सेवाओं की ओर तेजी से आकर्षित हो रहे हैं।
                </p>

                <p>
                  <strong>Verified ज्योतिषी बनने के फ़ायदे:</strong>
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>विश्वसनीय पहचान: Verified Badge मिलने से ग्राहक आप पर जल्दी भरोसा करते हैं</li>
                  <li>ऑनलाइन उपस्थिति: true Astrotalk आपके प्रोफ़ाइल को प्रमोट करता है</li>
                  <li>आमदनी का अवसर: आप अपनी सेवाओं के हिसाब से चार्ज तय कर सकते हैं</li>
                  <li>लचीलापन और आज़ादी: आप अपने समय के अनुसार कार्य कर सकते हैं</li>
                </ul>
                
                <p className="font-semibold text-gray-800">
                  👉 आज ही रजिस्टर करें और ज्योतिष की दुनिया में अपने नाम का परचम लहराएँ।
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Registration Form Page */
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-4 h-4 bg-white rounded-full"></div>
                <div className="absolute top-8 right-8 w-3 h-3 bg-white rounded-full"></div>
                <div className="absolute bottom-4 left-8 w-2 h-2 bg-white rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                  🕉️
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Complete Your Registration</h1>
                <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                  Join India's largest astrology platform and connect with millions of seekers worldwide
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/10 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">4.5M+</div>
                    <div className="text-sm opacity-90">Daily Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">13K+</div>
                    <div className="text-sm opacity-90">Astrologers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">20+</div>
                    <div className="text-sm opacity-90">Languages</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Container */}
            <div className="p-8 md:p-12">
              <form onSubmit={handleFormSubmit}>
                {/* Profile Upload */}
                <div className="text-center mb-8">
                  <div 
                    className="w-32 h-32 border-4 border-yellow-400 rounded-full mx-auto mb-4 bg-gray-50 flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg overflow-hidden"
                    onClick={() => document.getElementById('profilePic')?.click()}
                  >
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-400">📷</span>
                    )}
                  </div>
                  <input
                    type="file"
                    id="profilePic"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('profilePic')?.click()}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    Upload Profile Picture
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">Max 900KB (jpeg, png, jpg)</div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={`${countryCode} ${mobileNumber}`}
                      readOnly
                      className="mt-2 bg-gray-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="usa">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience (in Years) *</Label>
                    <Select value={formData.experience} onValueChange={(value) => setFormData({...formData, experience: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 Years</SelectItem>
                        <SelectItem value="2-5">2-5 Years</SelectItem>
                        <SelectItem value="6-10">6-10 Years</SelectItem>
                        <SelectItem value="11-15">11-15 Years</SelectItem>
                        <SelectItem value="15+">15+ Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-8">
                  <Label className="text-base font-semibold">Specializations *</Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {specializations.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedSpecs.includes(spec)
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-8">
                  <Label className="text-base font-semibold">Languages Known *</Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                          selectedLangs.includes(lang)
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 border-2 border-gray-200 text-gray-700 hover:bg-yellow-400 hover:text-black'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address and Bio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longBio">Long Bio *</Label>
                    <Textarea
                      id="longBio"
                      value={formData.longBio}
                      onChange={(e) => setFormData({...formData, longBio: e.target.value})}
                      placeholder="Tell us about your experience, approach, and expertise..."
                      required
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 mb-8">
                  <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) => setFormData({...formData, terms: checked === true})}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the <span className="text-blue-600 underline cursor-pointer">Terms and Conditions</span> *
                  </Label>
                </div>

                {/* Submit */}
                <div className="text-center border-t pt-8">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-12 py-4 text-lg font-bold rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Submit Registration
                  </Button>
                  <div className="text-sm text-gray-500 mt-4">
                    Your application will be reviewed within 24-48 hours
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AstrologerRegistration;