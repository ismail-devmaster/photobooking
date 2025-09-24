import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photographers | PhotoBooking',
  description: 'Find and book professional photographers',
};

export default function PhotographersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
