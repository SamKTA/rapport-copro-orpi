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
  visitData: {
    date: string
    address: string
    redacteur: string
    arrivalTime: string
    departureTime: string
    buildingCode: string
    personnesPresentes: string
  }
  observations: Observation[]
  signatureDataURL?: string
}

// Nettoyage texte
function sanitizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2013\u2014]/g, '-')
    .trim()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1]
      resolve(base64data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function GeneratePDF({ visitData, observations, signatureDataURL }: Props) {
  const [loading, setLoading] = useState(false)

  const handleGeneratePDF = async () => {
    setLoading(true)

    try {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pageSize: [number, number] = [595.28, 841.89]
      let page = pdfDoc.addPage(pageSize)
      const { height } = page.getSize()
      let y = height - 50

      // Page 1 — Informations générales
      page.drawText('Rapport de Visite', {
        x: 50,
        y,
        size: 24,
        font: fontBold,
        color: rgb(0.9, 0, 0),
      })
      y -= 40

      const addLine = (label: string, value: string) => {
        page.drawText(`${sanitizeText(label)} ${sanitizeText(value)}`, {
          x: 50,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
        y -= 20
      }

      addLine('Date :', visitData.date)
      addLine('Adresse :', visitData.address)
      addLine('Rédacteur :', visitData.redacteur)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine("Code immeuble :", visitData.buildingCode)
      addLine("Personnes présentes :", visitData.personnesPresentes)

      // Pages 2+ — Observations
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]

        page = pdfDoc.addPage(pageSize)
        let y = height - 50

        const type = sanitizeText(obs.type)
        const description = sanitizeText(obs.description)
        const action = sanitizeText(obs.action || '')
        const isPositive = type.toLowerCase().includes('positive')
        const titleColor = isPositive ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)

        page.drawText(`Observation ${i + 1} - ${type}`, {
          x: 50,
          y,
          size: 18,
          font: fontBold,
          color: titleColor,
        })
        y -= 30

        page.drawText(`Description :`, { x: 50, y, size: 14, font: fontBold })
        y -= 20
        page.drawText(description, { x: 50, y, size: 12, font })
        y -= 30

        if (action) {
          page.drawText(`Action à mener :`, { x: 50, y, size: 14, font: fontBold })
          y -= 20
          page.drawText(action, { x: 50, y, size: 12, font })
          y -= 30
        }

        for (const photo of obs.photos || []) {
          const arrayBuffer = await photo.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)

          let img
          try {
            img = await pdfDoc.embedPng(uint8Array)
          } catch {
            img = await pdfDoc.embedJpg(uint8Array)
          }

          const scaled = img.scale(0.1)

          if (y - scaled.height < 50) {
            page = pdfDoc.addPage(pageSize)
            y = height - 50
          }

          page.drawImage(img, {
            x: 50,
            y: y - scaled.height,
            width: scaled.width,
            height: scaled.height,
          })

          y -= scaled.height + 20
        }
      }

      // Derniere page - Signature
      page = pdfDoc.addPage(pageSize)
      y = height - 80

      page.drawText('Validation du rapport', {
        x: 50,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40

      page.drawText(visitData.redacteur, {
        x: 50,
        y,
        size: 14,
        font,
      })
      y -= 20

      page.drawText("Gestionnaire de copropriété", {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })
      y -= 40

      if (signatureDataURL) {
        const signatureBytes = await fetch(signatureDataURL).then(res => res.arrayBuffer())
        const signatureImg = await pdfDoc.embedPng(signatureBytes)
        const sigScaled = signatureImg.scale(0.5)

        page.drawImage(signatureImg, {
          x: 50,
          y: y - sigScaled.height,
          width: sigScaled.width,
          height: sigScaled.height,
        })
      }

      // Sauvegarde et envoi
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const base64 = await blobToBase64(blob)

      const recipient =
        visitData.redacteur === 'Elodie BONNAY'
          ? 'ebonnay@orpi.com'
          : visitData.redacteur === 'David SAINT-GERMAIN'
          ? 'dsaintgermain@orpi.com'
          : 'skita@orpi.com'

      await fetch('/api/send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          address: visitData.address,
          date: visitData.date,
          pdfBase64: base64,
        }),
      })

      // Download en local aussi
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()
    } catch (err: any) {
      console.error('Erreur détaillée :', err)
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
        {loading ? 'Génération en cours...' : '
