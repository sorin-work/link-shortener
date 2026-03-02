import { eq } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { links, users } from './db/schema.js';
import { hashPassword } from './lib/password.js';

export const DEMO_EMAIL = 'demo@example.com';
export const DEMO_PASSWORD = 'demo-password';

const DEMO_LINKS: { slug: string; url: string; title: string; ageDays: number }[] = [
  {
    slug: 'launch',
    url: 'https://blog.example.com/2026/introducing-our-new-app',
    title: 'Launch post',
    ageDays: 88,
  },
  {
    slug: 'docs',
    url: 'https://docs.example.com/getting-started',
    title: 'Getting started guide',
    ageDays: 85,
  },
  {
    slug: 'pricing',
    url: 'https://example.com/pricing?plan=team',
    title: 'Pricing page',
    ageDays: 80,
  },
  {
    slug: 'webinar-march',
    url: 'https://events.example.com/webinars/march-product-tour',
    title: 'March webinar',
    ageDays: 64,
  },
  {
    slug: 'gh',
    url: 'https://github.com/example/example-app',
    title: 'GitHub repository',
    ageDays: 60,
  },
  {
    slug: 'survey',
    url: 'https://forms.example.com/s/customer-survey-2026',
    title: 'Customer survey',
    ageDays: 41,
  },
  {
    slug: 'careers',
    url: 'https://example.com/careers#engineering',
    title: 'Engineering jobs',
    ageDays: 33,
  },
  {
    slug: 'newsletter-12',
    url: 'https://newsletter.example.com/issues/12',
    title: 'Newsletter #12',
    ageDays: 20,
  },
  {
    slug: 'spring-sale',
    url: 'https://shop.example.com/collections/spring',
    title: 'Spring sale',
    ageDays: 12,
  },
  {
    slug: 'podcast-ep7',
    url: 'https://podcast.example.com/episodes/7-scaling-sqlite',
    title: 'Podcast episode 7',
    ageDays: 6,
  },
  { slug: 'status', url: 'https://status.example.com', title: 'Status page', ageDays: 3 },
];

/** Creates the demo user and its links once. Returns false when it already exists. */
export async function seedDemo(db: Db, now = new Date()): Promise<boolean> {
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).get();
  if (existing) return false;

  const user = db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: await hashPassword(DEMO_PASSWORD),
      createdAt: new Date(now.getTime() - 90 * 86_400_000),
    })
    .returning()
    .get();

  for (const item of DEMO_LINKS) {
    const createdAt = new Date(now.getTime() - item.ageDays * 86_400_000);
    db.insert(links)
      .values({
        userId: user.id,
        slug: item.slug,
        url: item.url,
        title: item.title,
        createdAt,
        updatedAt: createdAt,
      })
      .run();
  }
  return true;
}
