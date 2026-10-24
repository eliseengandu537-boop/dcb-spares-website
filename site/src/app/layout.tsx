import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import "./browsing.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { EnquiryProvider } from "@/components/enquiry";
import { DemoAssistant } from "@/components/demo-assistant";
import { MobileActions } from "@/components/mobile-actions";

export const metadata: Metadata = {
  metadataBase: new URL("https://dcb-spares-reimagined.concrete-age-7451.chatgpt.site"),
  title: { default: "DCB Spares — Power every journey", template: "%s | DCB Spares" },
  description: "DCB Spares is the primary distributor of GB products. Explore aftermarket auto-electrical spares compatible with your vehicle.",
  openGraph: { title: "DCB Spares — Power every journey", description: "Your primary GB distributor. Find aftermarket auto-electrical parts compatible with your vehicle.", type: "website", locale: "en_ZA", images: [{ url: "/images/original/hero-alternator.webp", width: 1000, height: 1000, alt: "DCB GB automotive alternator" }] },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA" data-scroll-behavior="smooth"><body id="page-top"><a className="skip-link" href="#main">Skip to content</a><EnquiryProvider><Navigation /><main id="main" tabIndex={-1}>{children}</main><Footer /><DemoAssistant /><MobileActions /></EnquiryProvider></body></html>;
}
