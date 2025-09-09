// bun relsend send --template newsletter --to user@example.com
// bun relsend send --template newsletter --to user@example.com --from 1

import { defineEmail, defineMultiTemplateEmail } from "../src/templates/tsx-renderer";
import { OnboardEmail } from "./components/newsletter-1";
import { AdvancedDetailsEmail } from "./components/newsletter-2";

const titles = [
  "Welcome to Relsend - Your Modern Email CLI",
  "Get Started with Relsend - TypeScript Email Templates Made Easy",
] as const;
const randomTitle = (): string => titles[Math.floor(Math.random() * titles.length)] ?? titles[0];

export default defineMultiTemplateEmail({
  schemas: [
    defineEmail({
      name: "onboard",
      subject: randomTitle(),
      component: OnboardEmail,
    }),
    defineEmail({
      name: "advanced-details",
      subject: "Relsend Advanced Features - TypeScript Templates & More",
      component: AdvancedDetailsEmail,
    }),
  ],
});
