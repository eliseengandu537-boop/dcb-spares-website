import type { QuoteDetails } from "../quote";
import { quoteAreaLabel, type getQuoteRouting } from "../quote-routing";

type Routing = ReturnType<typeof getQuoteRouting>;
type EmailPhoto = { cid: string; filename: string };

// Customer content is always text, including inside link attributes. Email
// layouts use tables and inline styles so they also work without modern CSS.
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
function emailUrl(email: string) {
  return `mailto:${encodeURIComponent(email).replace(/%40/gi, "@")}`;
}
function link(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="color:#a91c2d;text-decoration:underline;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(label)}</a>`;
}
function row(label: string, value: string, href?: string) {
  return `<tr>
    <th scope="row" class="detail-label" width="145" align="left" valign="top" style="width:145px;padding:12px 16px 12px 0;border-bottom:1px solid #e9e9ed;color:#626671;font-size:13px;font-weight:400;line-height:21px;">${escapeHtml(label)}</th>
    <td valign="top" style="padding:12px 0;border-bottom:1px solid #e9e9ed;color:#20232b;font-size:15px;line-height:21px;word-break:break-word;overflow-wrap:anywhere;">${href ? link(href, value) : escapeHtml(value)}</td>
  </tr>`;
}
function sectionLabel(number: string, label: string) {
  return `<p style="margin:0 0 12px;color:#a91c2d;font-size:11px;line-height:18px;font-weight:700;letter-spacing:1.5px;">${number} &nbsp; / &nbsp; ${label}</p>`;
}

export function renderQuoteEmail(details: QuoteDetails, reference: string, routing: Routing, receivedAt: Date, photo?: EmailPhoto) {
  const area = quoteAreaLabel(details.area);
  const received = `${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Johannesburg" }).format(receivedAt)} SAST`;
  const assignment = routing.cc
    ? `Sales owner: ${routing.to.name}. Gary is copied for coordination. Please coordinate any reassignment with Gary.`
    : "Sales owner: Gary. Please assign this lead to one sales representative for the customer's area.";
  const summary = details.part.replace(/\s+/g, " ").trim();
  const fullSubject = `DCB quote ${reference} | ${area} | ${details.name} | ${summary}`.replace(/[\r\n\t]/g, " ");
  const subject = fullSubject.length > 230 ? `${fullSubject.slice(0, 229)}…` : fullSubject;
  const replyUrl = `${emailUrl(details.email)}?subject=${encodeURIComponent(`Re: DCB quote ${reference}`)}`;
  const phoneUrl = `tel:${details.phone.trim().startsWith("+") ? "+" : ""}${details.phone.replace(/\D/g, "")}`;
  const vehicleRows = [
    details.make ? row("Vehicle make", details.make) : "",
    details.model ? row("Vehicle model", details.model) : "",
  ].join("");
  const text = [
    "DCB AUTO SPARES — NEW QUOTE REQUEST", `Reference: ${reference}`, `Received: ${received}`, "",
    "ITEMS REQUESTED", details.part, "",
    ...(details.make || details.model ? ["VEHICLE DETAILS (IF SUPPLIED)", ...(details.make ? [`Vehicle make: ${details.make}`] : []), ...(details.model ? [`Vehicle model: ${details.model}`] : []), ""] : []),
    "CUSTOMER DETAILS", `Name: ${details.name}`, `Email: ${details.email}`, `Phone: ${details.phone}`,
    `Province / region: ${area}`, `Town / city / company: ${details.companyOrLocation}`, "",
    `Customer photo: ${photo ? `Attached (${photo.filename}).` : "Not supplied."}`, "",
    "SALES FOLLOW-UP", assignment, `Assigned representative: ${routing.to.name} <${routing.to.email}>`,
    ...(routing.cc ? [`CC: ${routing.cc.name} <${routing.cc.email}>`] : []),
    "Please review the requested items and reply to the customer with pricing and availability.",
    "Use Reply to email the customer directly, or call the number above.", "",
    "Submitted through DCB Assist at https://www.dcbspares.co.za/",
    "Customer enquiry only. Pricing, availability and fitment still need confirmation.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <title>DCB quote request ${escapeHtml(reference)}</title>
  <style>
    body, table, td, th, a { font-family:Arial,Helvetica,sans-serif; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    @media only screen and (max-width:600px) {
      .outer { padding:12px 8px !important; }
      .content { padding-left:22px !important; padding-right:22px !important; }
      .detail-label { width:98px !important; padding-right:12px !important; }
      .email-title { font-size:28px !important; line-height:34px !important; }
      .action { display:block !important; padding:0 0 12px !important; }
      .action a { display:block !important; text-align:center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f1f4;color:#20232b;-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;color:#f0f1f4;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(`${details.name} · ${area} · ${summary}`)}</div>
  <table role="presentation" width="100%" bgcolor="#f0f1f4" style="width:100%;background-color:#f0f1f4;">
    <tr><td class="outer" align="center" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" bgcolor="#ffffff" style="width:100%;max-width:640px;table-layout:fixed;background-color:#ffffff;border:1px solid #dedfe5;">
        <tr><td height="5" bgcolor="#d51f35" style="height:5px;font-size:1px;line-height:5px;background-color:#d51f35;">&nbsp;</td></tr>
        <tr><td class="content" bgcolor="#15181e" style="padding:28px 36px;background-color:#15181e;">
          <p style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:32px;letter-spacing:-0.8px;"><span style="color:#ff5265;">DCB</span> AUTO SPARES</p>
          <p style="margin:7px 0 0;color:#c2c5cd;font-size:10px;line-height:16px;letter-spacing:2px;">DCB ASSIST &nbsp; / &nbsp; WEBSITE ENQUIRY</p>
        </td></tr>
        <tr><td class="content" style="padding:32px 36px 26px;">
          <h1 class="email-title" style="margin:0 0 12px;color:#15181e;font-size:34px;line-height:40px;letter-spacing:-1px;">New quote request.</h1>
          <p style="margin:0;color:#626671;font-size:15px;line-height:24px;">A customer needs a quotation. Review their request below and contact them directly.</p>
          <table width="100%" style="width:100%;margin-top:18px;table-layout:fixed;">
            <tbody>${row("Reference", reference)}${row("Received", received)}</tbody>
          </table>
        </td></tr>
        <tr><td class="content" style="padding:0 36px 28px;">
          ${sectionLabel("01", "THE REQUEST")}
          <h2 style="margin:0 0 14px;font-size:20px;line-height:26px;color:#15181e;">Items requested</h2>
          <table role="presentation" width="100%" bgcolor="#faf3f4" style="width:100%;table-layout:fixed;background-color:#faf3f4;">
            <tr><td style="border-left:3px solid #d51f35;padding:20px;color:#20232b;font-size:16px;line-height:26px;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(details.part).replace(/\r\n|\r|\n/g, "<br>")}</td></tr>
          </table>
          ${vehicleRows ? `<h3 style="margin:20px 0 2px;color:#626671;font-size:13px;line-height:20px;">Vehicle details supplied by the customer</h3><table width="100%" style="width:100%;table-layout:fixed;"><tbody>${vehicleRows}</tbody></table>` : ""}
        </td></tr>
        <tr><td class="content" style="padding:0 36px 28px;">
          ${sectionLabel("02", "CUSTOMER DETAILS")}
          <h2 style="margin:0 0 6px;color:#15181e;font-size:22px;line-height:30px;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(details.name)}</h2>
          <table width="100%" style="width:100%;table-layout:fixed;"><tbody>
            ${row("Email address", details.email, emailUrl(details.email))}
            ${row("Phone number", details.phone, phoneUrl)}
            ${row("Province / region", area)}
            ${row("Town / city / company", details.companyOrLocation)}
          </tbody></table>
          <table role="presentation" style="margin-top:22px;"><tr>
            <td class="action" style="padding:0 12px 0 0;"><a href="${escapeHtml(replyUrl)}" style="display:inline-block;background-color:#bd1c30;border:1px solid #bd1c30;border-radius:5px;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:700;line-height:20px;text-decoration:none;mso-padding-alt:12px;">Reply to customer</a></td>
            <td class="action" style="padding:0;"><a href="${escapeHtml(phoneUrl)}" style="display:inline-block;background-color:#ffffff;border:1px solid #d4d6dd;border-radius:5px;padding:14px 22px;color:#20232b;font-size:14px;font-weight:700;line-height:20px;text-decoration:none;mso-padding-alt:12px;">Call customer</a></td>
          </tr></table>
          <p style="margin:12px 0 0;color:#626671;font-size:12px;line-height:19px;">You can also use your email app’s Reply button to contact this customer.</p>
        </td></tr>
        <tr><td class="content" style="padding:0 36px 28px;">
          ${sectionLabel("03", "CUSTOMER PHOTO")}
          ${photo ? `<p style="margin:0 0 14px;color:#626671;font-size:13px;line-height:21px;">Photo attached: <strong>${escapeHtml(photo.filename)}</strong>. If the preview is hidden, open the attachment.</p>
          <table role="presentation" width="100%" style="width:100%;table-layout:fixed;border:1px solid #e9e9ed;"><tr><td align="center" style="padding:14px;"><img src="cid:${escapeHtml(photo.cid)}" alt="Photo supplied by the customer with this quote request" width="480" style="display:block;width:100%;max-width:480px;height:auto;border:0;"></td></tr></table>`
    : '<p style="margin:0;color:#626671;font-size:14px;line-height:22px;">No photo supplied with this request.</p>'}
        </td></tr>
        <tr><td class="content" bgcolor="#f6f7f9" style="padding:24px 36px;background-color:#f6f7f9;border-top:1px solid #e9e9ed;">
          ${sectionLabel("04", "SALES FOLLOW-UP")}
          <h2 style="margin:0 0 8px;color:#15181e;font-size:20px;line-height:27px;">Assigned to ${escapeHtml(routing.to.name)}</h2>
          <p style="margin:0 0 6px;font-size:14px;line-height:22px;">${link(emailUrl(routing.to.email), routing.to.email)}</p>
          ${routing.cc ? `<p style="margin:0 0 14px;color:#626671;font-size:13px;line-height:21px;">CC: ${link(emailUrl(routing.cc.email), routing.cc.email)} &nbsp;·&nbsp; Sales coordination</p>` : ""}
          <p style="margin:0;color:#414550;font-size:14px;line-height:23px;">${routing.cc ? `${escapeHtml(routing.to.name)}, please contact the customer with pricing and availability. Gary is copied for coordination; please agree any reassignment with him.` : "Gary, please assign this enquiry to one sales representative for the customer’s area and arrange a response."}</p>
        </td></tr>
        <tr><td class="content" style="padding:22px 36px;">
          <p style="margin:0 0 7px;color:#626671;font-size:12px;line-height:19px;">Submitted through <a href="https://www.dcbspares.co.za/" style="color:#414550;text-decoration:underline;">DCB Assist</a> &nbsp;·&nbsp; ${escapeHtml(reference)}</p>
          <p style="margin:0;color:#626671;font-size:11px;line-height:18px;">Customer enquiry only. Pricing, availability and fitment still need confirmation.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}
