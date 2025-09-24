'use client'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useState } from 'react'

export default function GeneratePDF() {
  const [loading, setLoading] = useState(false)

  const handleGeneratePDF = async () => {
    setLoading(true)

    try {
      // 1. Crée un nouveau document PDF
      const pdfDoc = await PDFDocument.create()

      // 2. Ajoute une page
      const page = pdfDoc.addPage([595.28, 841.89]) // format A4 en points

      // 3. Police
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const { width, height } = page.getSize()

      // 4. Titre
      page.drawText('Rapport de Visite', {
        x: 50,
        y: height - 50,
        size: 24,
        font,
        color: rgb(0.9, 0, 0),
      })

      // 5. Exemple de texte
      page.drawText('Ceci est un test PDF généré dans le navigateur 🚀', {
        x: 50,
        y: height - 100,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      })

      // 6. Sauvegarde
      const pdfBytes = await pdfDoc.save()

      // 7. Téléchargement
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()
    } catch (err) {
      alert('Erreur lors de la génération du PDF')
      console.error(err)
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
