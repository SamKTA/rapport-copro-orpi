import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      to,
      address,
      date,
      pdfBase64
    } = body

    const { data, error } = await resend.emails.send({
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

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
