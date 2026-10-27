import { branches, whatsappNumber } from "@/lib/data";
import { absoluteUrl, serializeJsonLd, siteDescription, siteName, siteUrl } from "@/lib/seo";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function OrganizationData() {
  return <JsonLd data={{
    "@context": "https://schema.org", "@graph": [
      {
        "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "DCB Auto Spares", alternateName: siteName,
        url: `${siteUrl}/`, logo: absoluteUrl("/images/original/dcb-logo.webp"), description: siteDescription,
        email: "info@dcbspares.co.za", telephone: branches[0].tel,
        contactPoint: { "@type": "ContactPoint", telephone: whatsappNumber.replace(/\s/g, ""), contactType: "sales", availableLanguage: "English" },
      },
      { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: siteName, alternateName: "DCB Auto Spares", url: `${siteUrl}/`, inLanguage: "en-ZA", publisher: { "@id": `${siteUrl}/#organization` } },
    ],
  }} />;
}

export function BranchData() {
  return <JsonLd data={{
    "@context": "https://schema.org", "@graph": branches.map(branch => ({
      "@type": "AutoPartsStore", "@id": absoluteUrl(`/contact/#${branch.slug}`), name: branch.name,
      url: absoluteUrl(`/contact/#${branch.slug}`), telephone: branch.tel,
      image: absoluteUrl("/images/original/dcb-logo.webp"), parentOrganization: { "@id": `${siteUrl}/#organization` },
      address: { "@type": "PostalAddress", streetAddress: branch.street, addressLocality: branch.city, addressRegion: branch.region, postalCode: branch.postalCode, addressCountry: "ZA" },
    })),
  }} />;
}
