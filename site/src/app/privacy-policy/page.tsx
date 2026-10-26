import type { Metadata } from "next";
import { ArrowUpRight, Mail, ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { branches } from "@/lib/data";
import { salesContacts } from "@/lib/business";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How DCB Spares handles website enquiries, DCB Assist quotes, WhatsApp messages and personal information, and how to contact us about your privacy.",
  alternates: { canonical: "https://www.dcbspares.co.za/privacy-policy/" },
};

const contents = [
  ["who-we-are", "Who we are"],
  ["information", "Information we collect"],
  ["purposes", "How information is used"],
  ["assist-and-whatsapp", "DCB Assist & WhatsApp"],
  ["sharing", "Who receives information"],
  ["cookies", "Cookies & browsing"],
  ["storage", "Storage & security"],
  ["your-rights", "Your choices & rights"],
  ["updates", "Policy updates"],
] as const;

export default function PrivacyPolicyPage() {
  const alrode = branches[0];
  return <div className={`container ${styles.page}`}>
    <header className={styles.header}>
      <Eyebrow>YOUR INFORMATION. YOUR CHOICES.</Eyebrow>
      <div className={styles.headingRow}>
        <div><h1>Privacy <span>policy.</span></h1><p>What you share with DCB, how it is used, and how to ask about your personal information.</p></div>
        <ShieldCheck size={48} strokeWidth={1.2} aria-hidden="true" />
      </div>
      <div className={styles.meta}><span>WEBSITE PRIVACY NOTICE</span><span>Last updated <time dateTime="2026-10-26">26 October 2026</time></span></div>
    </header>

    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav className={styles.contents} aria-label="Privacy policy sections"><p>ON THIS PAGE</p><ol>{contents.map(([id, label], index) => <li key={id}><a href={`#${id}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a></li>)}</ol></nav>
        <a className={styles.contactCard} href="mailto:info@dcbspares.co.za?subject=Privacy%20request"><Mail size={20} aria-hidden="true" /><span>Have a privacy question?<strong>Contact DCB<ArrowUpRight size={15} aria-hidden="true" /></strong></span></a>
      </aside>

      <article className={styles.article} aria-label="DCB Spares privacy policy">
        <section id="who-we-are"><h2>01 <span>Who we are</span></h2>
          <p>This notice explains how DCB Auto Spares (DCB Spares, “we” or “us”) handles personal information through this website and the enquiries it generates. DCB is responsible for deciding how that information is used.</p>
          <address><strong>DCB Spares · Alrode</strong><br />{alrode.street}, {alrode.area}, South Africa<br /><a href="mailto:info@dcbspares.co.za?subject=Privacy%20request">info@dcbspares.co.za</a><br /><a href={`tel:${alrode.tel}`}>{alrode.phone}</a></address>
          <p>Use these contact details for privacy questions or requests, and ask for the person responsible for personal information.</p>
        </section>

        <section id="information"><h2>02 <span>Information we collect</span></h2>
          <p>You can browse our catalogue without creating an account. Information collected depends on how you contact us:</p>
          <ul>
            <li><strong>Quote requests:</strong> your name, email, phone number, company or location, the part you need, and your vehicle make and model.</li>
            <li><strong>WhatsApp enquiries:</strong> details you choose to include, such as part numbers, vehicle specifications, preferred branch, quantities and messages. You may also share photographs directly in WhatsApp.</li>
            <li><strong>Correspondence:</strong> messages and contact details you send to our team by email or WhatsApp.</li>
            <li><strong>Technical information:</strong> our hosting provider may process IP addresses, browser and device details, requested pages, timestamps and security or error information when serving the website.</li>
          </ul>
          <p>Form fields marked as required are needed to handle that request. Optional fields can be left blank. Without the required details, online quote submission is unavailable; you can still browse or contact a branch directly. Please share only information relevant to your enquiry.</p>
        </section>

        <section id="purposes"><h2>03 <span>How information is used</span></h2>
          <p>We use enquiry details to identify suitable parts, respond to requests, prepare quotations and follow up on the enquiry. Technical information supports website delivery, troubleshooting and protection against abuse or repeated submissions.</p>
          <p>Depending on the purpose, processing may be necessary to take steps towards a contract at your request, meet a legal obligation, protect legitimate interests in responding to customers and securing the website, or take place with your consent. These grounds are subject to South Africa’s <a href="https://www.justice.gov.za/legislation/acts/2013-004.pdf" target="_blank" rel="noopener noreferrer">Protection of Personal Information Act (POPIA)</a>.</p>
          <p>Submitting a website quote request does not subscribe you to a marketing list.</p>
        </section>

        <section id="assist-and-whatsapp"><h2>04 <span>DCB Assist & WhatsApp</span></h2>
          <p><strong>Ordinary chat:</strong> DCB Assist uses predefined replies and catalogue matching in your browser. Chat messages are not sent to an external AI model. Use “Start a new conversation” or reload the website to clear the ordinary chat history; simply closing the assistant does not clear it.</p>
          <p><strong>Submitting a quote:</strong> the quote form is separate from ordinary chat. When you select “Submit quote request”, its details are sent to our server for delivery to the sales team by email. If submission cannot be confirmed, the form offers WhatsApp and email alternatives.</p>
          <p><strong>Opening WhatsApp or email:</strong> preparing an enquiry creates a draft in your browser. Following a WhatsApp link shares the prefilled text with WhatsApp to open that draft; you then choose whether to send it to DCB. An email link opens a draft in your email application for you to review and send. These services handle information under their own privacy terms.</p>
        </section>

        <section id="sharing"><h2>05 <span>Who receives information</span></h2>
          <p>DCB Assist quote requests are addressed to all four sales contacts so the team can respond:</p>
          <ul className={styles.recipients}>{salesContacts.map(contact => <li key={contact.email}><a href={`mailto:${contact.email}`}>{contact.email}</a></li>)}</ul>
          <p>Service providers involved include Vercel for hosting, Google Workspace for configured quote-email delivery, and WhatsApp when you choose that contact option. Email or messaging providers you use also process the messages you send. Information may be disclosed where required by law.</p>
          <p>These providers may process information outside South Africa. POPIA restricts international transfers and requires an applicable legal basis, such as adequate protection or another permitted ground. Contact DCB for information about arrangements relevant to your enquiry.</p>
        </section>

        <section id="cookies"><h2>06 <span>Cookies & browsing</span></h2>
          <p>The current website does not include advertising pixels or analytics scripts, and does not save chat history or quote drafts in browser cookies or persistent browser storage. Unsubmitted entries remain in the current page session.</p>
          <p>Hosting and security services may use necessary technical mechanisms to deliver and protect the site. Catalogue searches made through the homepage appear in the page address and may be recorded in browser history or hosting request logs. Avoid entering personal information into catalogue search.</p>
          <p>Links to WhatsApp, Google Maps and other external services take you to services with their own cookie and privacy settings. See the <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel privacy notice</a>, <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google privacy policy</a> and <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">WhatsApp privacy policy</a>.</p>
        </section>

        <section id="storage"><h2>07 <span>Storage & security</span></h2>
          <p>The website does not maintain a customer-account database or a stored ordinary-chat transcript. The quote service temporarily keeps identifiers and records used to limit repeat requests. Submitted enquiries can remain in DCB’s email or messaging records, including service-provider backups.</p>
          <p>Retention depends on the enquiry, any resulting transaction, and applicable record-keeping requirements. POPIA limits retention to what is necessary or otherwise lawfully permitted. Ask DCB about retention or deletion of your particular records; clearing your browser does not delete a message already sent.</p>
          <p>The site uses encrypted connections and protections against abusive submissions. No online service can guarantee absolute security. Report suspected misuse of your information using the DCB contact details above.</p>
        </section>

        <section id="your-rights"><h2>08 <span>Your choices & rights</span></h2>
          <p>Subject to POPIA and applicable exceptions, you may:</p>
          <ul>
            <li>Ask whether DCB holds your personal information and request access.</li>
            <li>Request correction of inaccurate information or deletion where the legal requirements are met.</li>
            <li>Object to certain processing, or withdraw consent where processing relies on consent.</li>
            <li>Lodge a complaint with South Africa’s Information Regulator.</li>
          </ul>
          <p>Email <a href="mailto:info@dcbspares.co.za?subject=Privacy%20request">info@dcbspares.co.za</a> with your request and enough detail to identify the enquiry. DCB may need to verify your identity before providing or changing personal records. Withdrawal does not undo lawful processing that already took place.</p>
          <p>You can contact the Information Regulator directly through its <a href="https://inforegulator.org.za/complaints/" target="_blank" rel="noopener noreferrer">complaints page</a> or email <a href="mailto:POPIAComplaints@inforegulator.org.za">POPIAComplaints@inforegulator.org.za</a>. Its <a href="https://inforegulator.org.za/contact-us/" target="_blank" rel="noopener noreferrer">contact page</a> provides current contact details.</p>
        </section>

        <section id="updates"><h2>09 <span>Policy updates</span></h2>
          <p>This notice may be updated when the website, its services or applicable requirements change. The date above identifies this version. For questions about how this notice applies to your enquiry, contact DCB using the details above.</p>
        </section>
      </article>
    </div>
  </div>;
}
