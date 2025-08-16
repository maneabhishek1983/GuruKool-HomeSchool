import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Administrator - Gurukool Homeschool Platform',
  description:
    'Contact the administrator for account access or platform support',
};

export default function ContactAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
