import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, address, date, pdfBase64 } = body

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // ou ton domaine validé
        to,
        subject: `Rapport de visite - ${address} - ${date}`,
        html: `<p>Bonjour,<br><br>Veuillez trouver ci-joint le rapport de visite effectué à l'adresse : <strong>${address}</strong> le <strong>${date}</strong>.<br><br>Cordialement,<br>Service Syndic ORPI</p>`,
        attachments: [
          {
            filename: 'rapport-visite.pdf',
            content: pdfBase64,
            type: 'application/pdf'
          }
        ]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return NextResponse.json({ error: errorBody }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
