import './globals.css'

export const metadata = {
  title: 'Rapport Copropriété ORPI',
  description: 'Générateur de rapports de visite de copropriété',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
