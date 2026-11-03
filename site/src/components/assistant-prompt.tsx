"use client";

import { Sparkles } from "lucide-react";
import { requestAssistant } from "@/lib/assistant-events";

export function AssistantPrompt() {
  return (
    <div className="assistant-prompt">
      <p className="assistant-prompt-caption">Need help finding a part?</p>
      <div className="assistant-prompt-action">
        <button className="assistant-prompt-button" type="button" aria-haspopup="dialog" aria-controls="dcb-assistant" onClick={event => {
          event.currentTarget.focus({ preventScroll: true });
          requestAssistant();
        }}>
          <Sparkles size={20} aria-hidden="true" />
          <span>Chat with DCB Assist</span>
        </button>
        <svg className="assistant-prompt-arrow" width="56" height="48" viewBox="0 0 56 48" fill="none" aria-hidden="true" focusable="false">
          <path d="M48 7C53 26 33 26 7 26M7 26L17 17M7 26L17 35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
