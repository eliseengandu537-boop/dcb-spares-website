type AssistantRequest = "assist" | "quote";
const listeners = new Set<(request: AssistantRequest) => void>();
let pending: AssistantRequest | undefined;

// Keep an early click until the assistant has mounted during page hydration.
export function requestAssistant(request: AssistantRequest = "assist") {
  if (!listeners.size) pending = request;
  else for (const listener of listeners) listener(request);
}

export function subscribeAssistant(listener: (request: AssistantRequest) => void) {
  listeners.add(listener);
  if (pending) {
    const request = pending;
    pending = undefined;
    listener(request);
  }
  return () => { listeners.delete(listener); };
}
