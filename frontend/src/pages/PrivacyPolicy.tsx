import Header from "../components/Header";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                true Astrotalk ("we", "our", "true Astrotalk"), operated by Naamre Services(OPC) Pvt. Ltd., is committed to safeguarding the privacy of its users, including both astrologers and clients, whether registered or not. This Privacy Policy outlines how we collect, use, store, and disclose your information in compliance with applicable data protection laws.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Consent</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using the true Astrotalk platform, you consent to this Privacy Policy. Continued use of the platform indicates your unconditional consent to our practices regarding your personal data. By using this website, you also consent to receive communications from us via WhatsApp and other communication channels.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Personal Data:</strong> We collect personal information that you provide when creating an account, including your name, contact number, email, date of birth, gender, and any other details you voluntarily provide.</li>
                <li><strong>Payment Information:</strong> To process transactions, we collect payment details through secure third-party payment gateways.</li>
                <li><strong>Device Data:</strong> We automatically gather technical data, such as IP addresses, browser type, device identifiers, and cookies, to enhance your experience and provide a personalized experience.</li>
                <li><strong>Usage Data:</strong> We may collect data regarding your interactions with our platform, including your preferences, to optimise our services and offerings.</li>
                <li><strong>Chat History:</strong> We may collect the information you share with Astrologers via Chat or Voice & Video channels for internal audit and training purposes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Service Delivery:</strong> To facilitate consultations, communication between astrologers and clients, and process transactions.</li>
                <li><strong>Personalization:</strong> To customize your experience and recommend relevant content and services.</li>
                <li><strong>Marketing and Communication:</strong> To send promotional offers, newsletters, and updates through email, SMS, and WhatsApp.</li>
                <li><strong>Customer Support:</strong> To respond to your inquiries and provide assistance.</li>
                <li><strong>Analytics and Improvements:</strong> To analyse usage patterns, improve service quality, and develop new features.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                true Astrotalk does not sell or rent your personal data to third parties. However, we may share your data under the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party vendors who assist with business operations, such as payment processors and hosting services.</li>
                <li><strong>Legal Obligations:</strong> When required by law or to protect our rights, privacy, safety, or property.</li>
                <li><strong>Business Transfers:</strong> In the event of mergers, acquisitions, or asset sales, user data may be transferred.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures, such as encryption and access controls, to safeguard your data. Despite our efforts, no system is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain personal data only for as long as necessary for the purposes outlined in this policy, unless a longer retention period is required by law. Users may request data deletion by following the account deletion instructions within the app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed">
                Depending on your jurisdiction, you may have rights regarding your personal data, including the right to access, update, or delete your information. You can exercise these rights by contacting us at 
                <a href="mailto:help@trueastrotalk.com" className="text-blue-600 hover:underline ml-1">
                  help@trueastrotalk.com
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Camera, Voice and Microphone Access</h2>
              <p className="text-gray-700 leading-relaxed">
                true Astrotalk requires microphone, camera access solely to enable audio, video interactions for voice and video inputs. This access is used only during active sessions and is not stored or shared.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to collect data and enhance user experience. Users can manage cookie preferences through browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                true Astrotalk services are intended for users aged 18 and above. We do not knowingly collect personal information from minors. If we learn that we have collected data from a child under 18, we will take steps to delete such information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                This policy may be updated from time to time to reflect changes in our practices or legal requirements. We encourage periodic review of this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions or concerns about this policy, please email us at 
                <a href="mailto:help@trueastrotalk.com" className="text-blue-600 hover:underline ml-1">
                  help@trueastrotalk.com
                </a> or contact us at the address - Near- DAV Nageswar Public School, Chandaghasi, Ranchi-834010.
              </p>
            </section>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <p className="text-sm text-gray-600 text-center">
                <strong>Last Updated:</strong> January 2025
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
