import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "../styles/sweetalert-custom.css";

export const metadata: Metadata = {
  title: "True Astrotalk Admin",
  description: "Admin panel for True Astrotalk platform",
};

export default function RootLayout({
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
      </head>
      <body>
        {children}
        
        {/* Essential Libraries */}
        <Script src="/assets/libs/jquery/dist/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/assets/libs/bootstrap/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        
        {/* Socket.IO Client */}
        <Script src="https://cdn.socket.io/4.8.1/socket.io.min.js" strategy="afterInteractive" />
        
        {/* Socket.IO Test Script */}
        <Script src="/test-socket.js" strategy="lazyOnload" />
        
        {/* Required jQuery Plugins for Theme */}
        <Script src="/assets/libs/jquery-sparkline/jquery.sparkline.min.js" strategy="afterInteractive" />
        <Script src="/assets/libs/jquery-slimscroll/jquery.slimscroll.min.js" strategy="afterInteractive" />
        <Script src="/assets/libs/inputmask/dist/jquery.inputmask.min.js" strategy="afterInteractive" />
        <Script src="/assets/libs/select2/dist/js/select2.min.js" strategy="afterInteractive" />
        <Script src="/assets/libs/jvectormap-next/jquery-jvectormap.min.js" strategy="afterInteractive" />
        
        {/* Theme JS - Load after all dependencies */}
        <Script src="/assets/js/theme.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
