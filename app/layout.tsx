import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clarity — Smart Contract Risk Highlighter',
  description:
    'Upload legal contracts, detect risky clauses with AI, link supporting documents, and visualize relationships on a knowledge graph.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
