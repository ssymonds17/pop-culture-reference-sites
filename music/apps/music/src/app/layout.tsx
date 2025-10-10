import { MusicProvider } from '@music/shared-state';
import { Navbar } from '../components';
import './global.css';

export const metadata = {
  title: 'Music DB',
  description: 'A Private Music Database',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MusicProvider>
          <Navbar />
          {children}
        </MusicProvider>
      </body>
    </html>
  );
}
