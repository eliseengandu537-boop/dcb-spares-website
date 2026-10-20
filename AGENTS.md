# Premium Website Design Instructions

These instructions apply whenever I ask you to build, redesign, improve, or style a website or web application.

## Default visual direction

Create a premium, modern, cinematic website rather than a generic template.

Unless I explicitly request a different style, use:
- Strong visual hierarchy and premium typography.
- Glassmorphism with translucent panels, backdrop blur, subtle borders, reflections, and layered depth.
- Animated gradient / aurora backgrounds.
- Liquid, oil, fluid, blob, metaball, or shader-inspired background effects where appropriate.
- Smooth scrolling and polished page/section transitions.
- Scroll-triggered reveals, staggered entrances, parallax, depth, and tasteful micro-interactions.
- Premium button, card, navigation, image, text, and hover animations.
- Soft lighting, glow, gradients, shadows, grain/noise, and layered atmospheric effects.
- Large high-quality hero sections with intentional composition.
- Responsive layouts that look excellent on desktop, tablet, and mobile.
- A refined, distinctive aesthetic. Avoid generic SaaS-template styling.

Do not make every element animate constantly. Motion should feel intentional, smooth, elegant, and expensive.

## Preferred technology

For new projects, prefer:
- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Framer Motion for component and page motion
- GSAP + ScrollTrigger for advanced scroll sequences when useful
- Three.js / React Three Fiber / Drei for real 3D or WebGL scenes when they materially improve the design
- CSS gradients, masks, filters, SVG, Canvas, WebGL, or shaders for liquid/oil effects

Do not add a heavy dependency when a lightweight CSS or SVG implementation can achieve the same quality.

## Motion system

Include a cohesive motion language:
- Smooth initial page entrance
- Hero reveal sequence
- Staggered text and card reveals
- Scroll-triggered section entrances
- Subtle parallax and depth
- Magnetic or animated CTA interactions where appropriate
- Smooth hover and focus transitions
- Animated navigation / mobile menu
- Shared-layout or page transitions when appropriate
- Background motion that remains subtle behind content
- Optional cursor-follow glow on desktop when it improves the experience

Animations must use transform and opacity where possible and should remain smooth.

Respect `prefers-reduced-motion` and provide a clean reduced-motion experience.

## Glassmorphism

When glass UI is used:
- Use backdrop blur, translucency, subtle borders, internal highlights, and soft shadows.
- Keep text contrast accessible.
- Layer glass surfaces at different depths rather than making every component identical.
- Avoid excessive blur that hurts readability or performance.

## Liquid / oil visual effects

When I ask for oil, liquid, fluid, glossy, or organic effects:
- Prefer an animated shader/WebGL approach for hero/background areas when appropriate.
- Otherwise use layered radial gradients, animated blobs, SVG filters, masks, displacement, or Canvas.
- Keep the effect elegant and interactive without obscuring content.
- Ensure it degrades gracefully on lower-powered/mobile devices.

## Design quality rules

Before implementation:
1. Understand the brand, audience, business goal, and required sections.
2. Establish a visual concept, typography, spacing system, and animation language.
3. Build reusable components rather than one huge page component.

During implementation:
- Use semantic HTML and accessible interactions.
- Maintain strong contrast and visible keyboard focus states.
- Make all layouts responsive.
- Optimize images and fonts.
- Lazy-load heavy 3D/WebGL sections when possible.
- Avoid layout shift and unnecessary re-renders.
- Do not sacrifice usability for visual effects.
- Do not use placeholder-looking gradients, random icons, or generic stock-template layouts.
- Do not leave unfinished TODOs when the requested feature can be implemented.

## Performance targets

Aim for a premium visual experience without making the site feel heavy:
- Keep animation work off the main thread where practical.
- Use GPU-friendly transforms.
- Pause or simplify expensive animations when off-screen.
- Reduce effects on small screens when necessary.
- Dynamically import heavy 3D/WebGL components.
- Keep mobile performance a first-class requirement.

## Implementation behavior

When I ask you to build or redesign:
- Inspect the existing project first.
- Preserve working functionality unless the requested design requires a change.
- Implement the design directly; do not only describe what I should do.
- Reuse existing brand assets and components where appropriate.
- Run lint/type checks and the available build/tests after meaningful changes.
- Fix problems you introduce.
- Keep code organized and production-ready.

If the project already has a design system, improve it rather than replacing it blindly.

## Creative standard

The final result should feel like work from a high-end digital studio:
- cinematic
- polished
- immersive
- modern
- interactive
- distinctive
- professional

Use visual restraint. Premium design comes from composition, hierarchy, spacing, typography, lighting, motion, and detail — not from adding as many effects as possible.

When the brief is ambiguous, choose a strong visual direction and implement it rather than defaulting to a plain template.
