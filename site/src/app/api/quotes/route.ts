import { createQuoteHandler } from "@/lib/server/quote-handler";
import { deliverQuote, getMailConfig } from "@/lib/server/quote-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createQuoteHandler({
  getConfig: () => getMailConfig(process.env),
  deliver: deliverQuote,
});
