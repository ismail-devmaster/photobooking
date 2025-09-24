import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | PhotoBooking',
  description: 'Sign in or create an account to access PhotoBooking',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
