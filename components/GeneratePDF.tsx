"use client"

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
  photoCopro?: File | null
}

function sanitizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

function cleanFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
}

export default function GeneratePDF({ visitData, observations, signatureDataURL, photoCopro }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleGeneratePDF = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pageSize: [number, number] = [595.28, 841.89]
      let page = pdfDoc.addPage(pageSize)
      let y = page.getHeight() - 50

      page.drawRectangle({ x: 25, y: page.getHeight() - 60, width: 140, height: 30, color: rgb(1, 0, 0) })
      page.drawText('ORPI Adimmo', {
        x: 40,
        y: page.getHeight() - 42,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      })

      page.drawText('RAPPORT DE VISITE', {
        x: 200,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
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
      addLine("Code :", visitData.buildingCode)
      addLine("Personnes présentes :", visitData.personnesPresentes)

      if (photoCopro) {
        const imageBitmap = await createImageBitmap(photoCopro)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const maxWidth = 500
        const scale = maxWidth / imageBitmap.width
        canvas.width = maxWidth
        canvas.height = imageBitmap.height * scale
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
        const compressedBlob: Blob = await new Promise(resolve =>
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.85)
        )
        const arrayBuffer = await compressedBlob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const img = await pdfDoc.embedJpg(uint8Array)
        const scaled = img.scale(0.6)

        if (y - scaled.height < 50) {
          page = pdfDoc.addPage(pageSize)
          y = page.getHeight() - 50
        }

        page.drawImage(img, {
          x: 50,
          y: y - scaled.height,
          width: scaled.width,
          height: scaled.height,
        })
        y -= scaled.height + 20
      }

      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        page = pdfDoc.addPage(pageSize)
        y = page.getHeight() - 50

        const orpiWidth = 120
        const orpiHeight = 25
        page.drawRectangle({ x: 50, y: y + 10, width: orpiWidth, height: orpiHeight, color: rgb(1, 0, 0) })
        page.drawText('ORPI Adimmo', {
          x: 55,
          y: y + 18,
          size: 12,
          font: fontBold,
          color: rgb(1, 1, 1),
        })

        const bannerText = 'OBSERVATIONS'
        const textSize = 14
        const bannerHeight = 30
        const bannerWidth = 500
        y -= 20
        page.drawRectangle({ x: 50, y: y, width: bannerWidth, height: bannerHeight, color: rgb(1, 0, 0) })
        page.drawText(bannerText, {
          x: 50 + (bannerWidth - fontBold.widthOfTextAtSize(bannerText, textSize)) / 2,
          y: y + 8,
          size: textSize,
          font: fontBold,
          color: rgb(1, 1, 1),
        })
        y -= bannerHeight + 10

        const type = sanitizeText(obs.type)
        const description = sanitizeText(obs.description)
        const action = sanitizeText(obs.action || '')
        const isPositive = type.toLowerCase().includes('positive')
        const titleColor = isPositive ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)

        page.drawText(`Observation ${i + 1} - ${type}`, { x: 50, y, size: 16, font: fontBold, color: titleColor })
        y -= 25
        page.drawText('Description :', { x: 50, y, size: 14, font: fontBold })
        y -= 20
        page.drawText(description, { x: 50, y, size: 12, font })
        y -= 30

        if (action) {
          page.drawText('Action à mener :', { x: 50, y, size: 14, font: fontBold })
          y -= 20
          page.drawText(action, { x: 50, y, size: 12, font })
          y -= 30
        }

        if (obs.photos?.length) {
          for (const photo of obs.photos) {
            const imageBitmap = await createImageBitmap(photo)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const maxWidth = 400
            const scale = maxWidth / imageBitmap.width
            canvas.width = maxWidth
            canvas.height = imageBitmap.height * scale
            ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
            const compressedBlob: Blob = await new Promise(resolve =>
              canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.7)
            )
            const arrayBuffer = await compressedBlob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            const img = await pdfDoc.embedJpg(uint8Array)
            const scaled = img.scale(0.5)

            if (y - scaled.height < 50) {
              page = pdfDoc.addPage(pageSize)
              y = page.getHeight() - 50
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
      }

      const lastPage = pdfDoc.addPage(pageSize)
      y = lastPage.getHeight() - 80
      lastPage.drawText('Validation du rapport', {
        x: 50,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40
      lastPage.drawText(visitData.redacteur, { x: 50, y, size: 14, font })
      y -= 20
      lastPage.drawText('Gestionnaire de copropriété', {
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
        lastPage.drawImage(signatureImg, {
          x: 50,
          y: y - sigScaled.height,
          width: sigScaled.width,
          height: sigScaled.height,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const base64 = await blobToBase64(blob)
      const recipient = visitData.redacteur === 'Elodie BONNAY'
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

      const fileName = `rapport_${cleanFileName(visitData.address)}_${visitData.date}.pdf`
      const formData = new FormData()
      formData.append('filename', fileName)
      formData.append('file', new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), fileName)

      await fetch('/api/save-pdf', {
        method: 'POST',
        body: formData,
      })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()

      setSuccess(true)
    } catch (err: any) {
      console.error('Erreur détaillée :', err)
      alert(`Erreur lors de la génération : ${err.message || 'voir console'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center mt-10 space-y-4">
      <button
        onClick={handleGeneratePDF}
        disabled={loading}
        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50"
      >
        {loading ? 'Génération en cours...' : '📄 Générer le rapport PDF'}
      </button>
      {success && (
        <p className="text-green-600 font-medium">
          ✅ Rapport généré, envoyé par email et sauvegardé sur Supabase
        </p>
      )}
    </div>
  )
}
