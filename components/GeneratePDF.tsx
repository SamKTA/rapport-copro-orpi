"use client"

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient' // ✅ Import Supabase

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

function sanitizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[…]/g, '...')
    .replace(/[–—]/g, '-')
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

      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]

        page = pdfDoc.addPage(pageSize)
        y = height - 50

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
          const imageBitmap = await createImageBitmap(photo)

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!

          const maxWidth = 400
          const scale = maxWidth / imageBitmap.width
          canvas.width = maxWidth
          canvas.height = imageBitmap.height * scale

          ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

          const compressedBlob: Blob = await new Promise(resolve =>
            canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.6)
          )

          const arrayBuffer = await compressedBlob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const img = await pdfDoc.embedJpg(uint8Array)
          const scaled = img.scale(0.8)

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

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      console.log("Taille du PDF (Mo) :", (pdfBytes.length / (1024 * 1024)).toFixed(2))

      const base64 = await blobToBase64(blob)

      const recipient =
        visitData.redacteur === 'Elodie BONNAY'
          ? 'ebonnay@orpi.com'
          : visitData.redacteur === 'David SAINT-GERMAIN'
          ? 'dsaintgermain@orpi.com'
          : 'skita@orpi.com'

      await fetch('/api/send-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: `rapport-visite-${Date.now()}.pdf`,
          file: base64, // contenu en base64 du PDF
          mimetype: 'application/pdf',
        }),
      })

      // ✅ UPLOAD SUPABASE
      const fileName = `rapport-${visitData.date}-${Date.now()}.pdf`
      const { data, error } = await supabase.storage
        .from('rapports-visite')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (error) {
        console.error("❌ Erreur Supabase Storage:", error)
      } else {
        console.log("✅ Rapport stocké sur Supabase:", data)
      }

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
        {loading ? 'Génération en cours...' : '📄 Générer le rapport PDF'}
      </button>
    </div>
  )
}
