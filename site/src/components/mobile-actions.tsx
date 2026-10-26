"use client";
import { requestAssistant } from "@/lib/assistant-events";

import Link from "next/link";
import { ArrowUp, MessageCircle, Search, Sparkles } from "lucide-react";
import { whatsapp } from "@/lib/data";

export function MobileActions() {
  return <nav className="mobile-actions" aria-label="Quick actions">
    <Link href="/products/#catalogue-search"><Search size={20} /><span>Find parts</span></Link>
    <a href={whatsapp()} target="_blank" rel="noopener noreferrer" aria-label="Chat with DCB Spares on WhatsApp"><MessageCircle size={20} /><span>WhatsApp</span></a>
    <button type="button" aria-label="Open DCB Assist" aria-haspopup="dialog" onClick={() => requestAssistant()}><Sparkles size={20} /><span>DCB Assist</span></button>
    <a href="#page-top" aria-label="Back to top"><ArrowUp size={20} /><span>Top</span></a>
  </nav>;
}
