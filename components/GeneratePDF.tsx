'use client'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useState } from 'react'

export default function GeneratePDF() {
  const [loading, setLoading] = useState(false)

  // ✅ Fonction utilitaire pour supprimer les caractères non-ASCII
  function cleanText(text: string): string {
    return text.replace(/[^\x00-\x7F]/g, '') // supprime les emojis et caractères spéciaux
  }

  // 🧩 Données fictives de test
  const fakeVisitData = {
    date: '2025-09-24',
    address: '24 rue Victor Hugo, Limoges',
    redacteur: 'Samuel KITA',
    arrivalTime: '09h15',
    departureTime: '10h30',
    buildingCode: '159B',
    personnesPresentes: 'Mme Dupont, M. Leblanc'
  }

  const handleGeneratePDF = async () => {
    setLoading(true)

    try {
      // 1. Nouveau PDF
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595.28, 841.89]) // A4

      // 2. Polices et dimensions
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const { width, height } = page.getSize()

      // 3. Titre
      page.drawText(cleanText('Rapport de Visite'), {
        x: 50,
        y: height - 50,
        size: 24,
        font,
        color: rgb(0.9, 0, 0),
      })

      // 4. Données de la visite
      const lineHeight = 20
      let y = height - 90

      const addLine = (label: string, value: string) => {
        page.drawText(cleanText(`${label} ${value}`), {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
      }

      addLine('Date :', fakeVisitData.date)
      addLine('Adresse :', fakeVisitData.address)
      addLine('Redacteur :', fakeVisitData.redacteur)
      addLine("Heure d'arrivee :", fakeVisitData.arrivalTime)
      addLine('Heure de depart :', fakeVisitData.departureTime)
      addLine('Code immeuble :', fakeVisitData.buildingCode)
      addLine('Personnes presentes :', fakeVisitData.personnesPresentes)

      // 5. Sauvegarde et téléchargement
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
