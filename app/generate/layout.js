import { buildMetadata } from '../lib/site';

export const metadata = buildMetadata({
  title: 'Generate',
  description:
    'Create captions, bios, hooks, and statuses with platform selection, tone pills, length control, Hinglish mode, emojis, hashtags, and optional image context.',
  path: '/generate',
  keywords: [
    'AI generator',
    'caption generator',
    'bio generator',
    'AI writing generator',
  ],
});

export default function GenerateLayout({ children }) {
  return children;
}
