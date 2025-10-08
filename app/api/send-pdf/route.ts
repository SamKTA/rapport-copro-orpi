import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, address, date, pdfUrl } = body // 🟢 on récupère l’URL au lieu du base64

    // Envoi de l'e-mail via Resend avec le lien public
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'rapport@agence-skdigital.fr',
        to,
        subject: `Rapport de visite - ${address} - ${date}`,
        html: `
          <p>Bonjour,</p>
          <p>Le rapport de visite du <strong>${date}</strong> pour <strong>${address}</strong> est disponible.</p>
          <p>
            <a href="${pdfUrl}" 
              target="_blank" 
              style="display:inline-block;background-color:#d32f2f;color:#fff;padding:10px 18px;
                     border-radius:6px;text-decoration:none;font-weight:bold;margin-top:10px;">
              📄 Télécharger le rapport
            </a>
          </p>
          <p style="margin-top:20px;">Cordialement,<br><strong>Service Syndic ORPI</strong></p>
        `,
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return NextResponse.json({ error: errorBody }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erreur dans /api/send-pdf :', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
