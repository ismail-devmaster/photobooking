import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | PhotoBooking',
  description: 'Manage your profile and settings',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
