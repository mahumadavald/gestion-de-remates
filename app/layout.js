export const metadata = {
  title: 'Gestión de Remates',
  description: 'Plataforma de remates online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* ── Tipografía global — Inter (UI/body) + Poppins (display/headings) ── */}
        {/* Para cambiar display font: reemplaza 'Poppins' por 'Satoshi' o 'General+Sans' */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
