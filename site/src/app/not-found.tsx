import { ButtonLink, Eyebrow } from "@/components/ui";

export default function NotFound() {
  return <section className="container not-found"><Eyebrow>404 / WRONG TURN</Eyebrow><h1>Let’s get you<br /><span>back on track.</span></h1><p>This page isn’t here, but the right part could be.</p><ButtonLink href="/products/">Explore our products</ButtonLink></section>;
}
