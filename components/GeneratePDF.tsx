'use client'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useState } from 'react'

// Fonction utilitaire pour nettoyer le texte
function cleanText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '') // supprime les caractères non-ASCII
    .replace(/[\u2018\u2019]/g, "'") // apostrophes courbes
    .replace(/[\u201C\u201D]/g, '"') // guillemets courbes
    .replace(/[\u2026]/g, '...')     // points de suspension
    .replace(/[\u2013\u2014]/g, '-') // tirets
    .trim()
}

// Fonction de nettoyage : supprime tout caractère non compatible avec WinAnsi (emoji, symbole, etc.)
function sanitizeText(text: string) {
  return text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')   // retire les accents
    .replace(/[^\x00-\x7F]/g, '')      // retire les caractères non-ASCII
}

export default function GeneratePDF({ visitData }: { visitData: any }) {
  const [loading, setLoading] = useState(false)

  const handleGeneratePDF = async () => {
    setLoading(true)

    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595.28, 841.89]) // format A4

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const { height } = page.getSize()

      // Titre
      page.drawText('Rapport de Visite', {
        x: 50,
        y: height - 50,
        size: 24,
        font,
        color: rgb(0.9, 0, 0),
      })

      // Contenu
      const lineHeight = 20
      let y = height - 90

      const addLine = (label: string, value: string) => {
        page.drawText(`${label} ${sanitizeText(value)}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      })
      y -= lineHeight
    }

      addLine('📅 Date :', visitData.date)
      addLine('🏠 Adresse :', visitData.address)
      addLine('✍️ Rédacteur :', visitData.redacteur)
      addLine('🕘 Heure d\'arrivée :', visitData.arrivalTime)
      addLine('🕥 Heure de départ :', visitData.departureTime)
      addLine('🔐 Code immeuble :', visitData.buildingCode)
      addLine('👥 Personnes présentes :', visitData.personnesPresentes)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()
    } catch (err: any) {
      console.error('Erreur détaillée :', err)
      alert(`Erreur PDF : ${err.message || 'voir console'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center mt-10">
      <button
        onClick={handleGeneratePDF}
        disabled={loading}
        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50"
      >
        {loading ? 'Génération en cours...' : '📄 Générer le rapport PDF'}
      </button>
    </div>
  )
}
