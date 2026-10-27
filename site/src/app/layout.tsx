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
import { OrganizationData } from "@/components/structured-data";
import { allowIndexing, homeMetadata, siteName, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  ...homeMetadata,
  metadataBase: new URL(siteUrl),
  title: { default: `Auto-Electrical Spares & GB Distributor | ${siteName}`, template: `%s | ${siteName}` },
  robots: { index: allowIndexing, follow: true, googleBot: { index: allowIndexing, follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA" data-scroll-behavior="smooth"><body id="page-top"><OrganizationData /><a className="skip-link" href="#main">Skip to content</a><EnquiryProvider><Navigation /><main id="main" tabIndex={-1}>{children}</main><Footer /><DemoAssistant /><MobileActions /></EnquiryProvider></body></html>;
}
