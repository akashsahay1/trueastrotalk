import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "True Astrotalk - Connect with Expert Astrologers",
  description: "Get personalized astrological guidance from certified experts. Chat, call, or video consultation available 24/7.",
};

export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="/assets/images/favicon.ico" type="image/x-icon" />
        {/* Bootstrap CSS only for frontend */}
        <link rel="stylesheet" href="/assets/libs/bootstrap/dist/css/bootstrap.min.css" />
        
        {/* Custom CSS overrides to match original design */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Override Bootstrap container max-width to match original design */
          @media (min-width: 1200px) {
            .container {
              max-width: 1400px !important;
            }
          }
          
          /* Additional responsive overrides */
          @media (min-width: 992px) {
            .container {
              max-width: 1200px;
            }
          }
          
          @media (min-width: 1200px) {
            .container {
              max-width: 1400px;
            }
          }
          
          /* Ensure proper spacing */
          .container {
            padding-left: 15px;
            padding-right: 15px;
          }
        `}} />
      </head>
      <body>
        {children}
        
        {/* Essential Libraries for Frontend */}
        <script src="/assets/libs/jquery/dist/jquery.min.js"></script>
        <script src="/assets/libs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}