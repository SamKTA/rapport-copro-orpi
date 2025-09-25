'use client'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useState } from 'react'

interface Observation {
  type: string
  description: string
  action?: string
  photos: File[]
}

interface Props {
  visitData: any
  observations: Observation[]
  signatureDataURL?: string
}

function sanitizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^\x00-\x7F]/g, '')    // non-ASCII
    .replace(/[\u2018\u2019]/g, "'") // apostrophes
    .replace(/[\u201C\u201D]/g, '"') // guillemets
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2013\u2014]/g, '-')
    .trim()
}

export default function GeneratePDF({ visitData, observations, signatureDataURL }: Props) {
  const [loading, setLoading] = useState(false)

  const handleGeneratePDF = async () => {
    setLoading(true)

    try {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // -------- PAGE 1 : Infos principales --------
      const page = pdfDoc.addPage([595.28, 841.89])
      const { height } = page.getSize()
      let y = height - 50
      const lineHeight = 20

      page.drawText('ORPI Adimmo', { x: 50, y, font, size: 16, color: rgb(1, 0, 0) })
      y -= 30
      page.drawText('RAPPORT DE VISITE', { x: 200, y, font, size: 18 })
      y -= 40

      const addLine = (label: string, value: string) => {
        page.drawText(`${sanitizeText(label)} ${sanitizeText(value)}`, {
          x: 50,
          y,
          font,
          size: 12,
        })
        y -= lineHeight
      }

      addLine('Date :', visitData.date)
      addLine('Rédacteur :', visitData.redacteur)
      addLine('Adresse :', visitData.address)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine('Code :', visitData.buildingCode)
      addLine('Personnes présentes :', visitData.personnesPresentes)

      // -------- OBSERVATIONS --------
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        const obsPage = pdfDoc.addPage([595.28, 841.89])
        let yObs = 780

        const obsType = obs.type.includes('Positive') ? 'Positive' : 'À améliorer'

        obsPage.drawText('ORPI Adimmo', { x: 50, y: yObs, font, size: 16, color: rgb(1, 0, 0) })
        yObs -= 30
        obsPage.drawText('RAPPORT DE VISITE', { x: 200, y: yObs, font, size: 18 })
        yObs -= 40

        obsPage.drawText(`Observation ${i + 1} - ${sanitizeText(obsType)}`, {
          x: 50,
          y: yObs,
          font,
          size: 14,
        })
        yObs -= 30

        obsPage.drawText('Description :', { x: 50, y: yObs, font, size: 12 })
        yObs -= 20
        const descLines = sanitizeText(obs.description).split('\n')
        descLines.forEach(line => {
          obsPage.drawText(line, { x: 60, y: yObs, font, size: 11 })
          yObs -= 16
        })

        if (obs.action) {
          yObs -= 16
          obsPage.drawText("Action à mener :", { x: 50, y: yObs, font, size: 12 })
          yObs -= 20
          const actLines = sanitizeText(obs.action).split('\n')
          actLines.forEach(line => {
            obsPage.drawText(line, { x: 60, y: yObs, font, size: 11 })
            yObs -= 16
          })
        }

        // -------- PHOTOS --------
        if (obs.photos && obs.photos.length > 0) {
          yObs -= 20
          obsPage.drawText('Photos :', { x: 50, y: yObs, font, size: 12 })
          yObs -= 10

          for (let p = 0; p < obs.photos.length; p++) {
            const photo = obs.photos[p]
            const imgBytes = await photo.arrayBuffer()
            const img = await pdfDoc.embedPng(imgBytes)
            const imgDims = img.scale(0.2)

            if (yObs < 150) {
              const newPage = pdfDoc.addPage([595.28, 841.89])
              yObs = 780
              newPage.drawImage(img, { x: 50, y: yObs - imgDims.height, width: imgDims.width, height: imgDims.height })
              yObs -= imgDims.height + 20
            } else {
              obsPage.drawImage(img, { x: 50, y: yObs - imgDims.height, width: imgDims.width, height: imgDims.height })
              yObs -= imgDims.height + 20
            }
          }
        }
      }

      // -------- VALIDATION / SIGNATURE --------
      const signPage = pdfDoc.addPage([595.28, 841.89])
      let yVal = 750

      signPage.drawText('ORPI Adimmo', { x: 50, y: yVal, font, size: 16, color: rgb(1, 0, 0) })
      yVal -= 30
      signPage.drawText('RAPPORT DE VISITE', { x: 200, y: yVal, font, size: 18 })
      yVal -= 60

      signPage.drawText('VALIDATION DU RAPPORT', { x: 180, y: yVal, font, size: 14 })
      yVal -= 30
      signPage.drawText(sanitizeText(visitData.redacteur), { x: 220, y: yVal, font, size: 12 })
      yVal -= 18
      signPage.drawText('Gestionnaire de copropriété', { x: 180, y: yVal, font, size: 11 })

      if (signatureDataURL) {
        const sigImg = await fetch(signatureDataURL).then(res => res.arrayBuffer())
        const sig = await pdfDoc.embedPng(sigImg)
        const sigDims = sig.scale(0.5)
        signPage.drawImage(sig, { x: 170, y: yVal - 80, width: sigDims.width, height: sigDims.height })
      }

      // -------- EXPORT --------
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()
    } catch (err: any) {
      console.error('Erreur PDF :', err)
      alert(`Erreur lors de la génération : ${err.message || 'voir console'}`)
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
