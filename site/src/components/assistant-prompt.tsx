"use client";

import { Sparkles } from "lucide-react";
import { requestAssistant } from "@/lib/assistant-events";

export function AssistantPrompt() {
  return (
    <button className="assistant-prompt" type="button" aria-label="Get help with DCB Assist" aria-haspopup="dialog" aria-controls="dcb-assistant" onClick={event => {
      event.currentTarget.focus({ preventScroll: true });
      requestAssistant();
    }}>
      <span className="assistant-prompt-icon" aria-hidden="true"><Sparkles size={20} /></span>
      <span className="assistant-prompt-copy"><span>Need help finding a part?</span><strong className="assistant-prompt-desktop">Open DCB Assist</strong><strong className="assistant-prompt-mobile">Tap DCB Assist below</strong></span>
      <svg className="assistant-prompt-arrow" width="44" height="52" viewBox="0 0 44 52" fill="none" aria-hidden="true" focusable="false">
        <g className="assistant-prompt-arrow-path"><path d="M6 5C35 5 39 33 17 43M17 43L19 31M17 43L30 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></g>
      </svg>
    </button>
  );
}
