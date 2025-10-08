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
    .replace(/\r?\n|\r/g, ' ') // évite l'erreur WinAnsi et les retours invisibles
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[…]/g, '...')
    .replace(/[–—]/g, '-')
    .trim()
}

function drawWrappedText(page: any, text: string, x: number, y: number, maxWidth: number, font: any, size: number) {
  const words = text.split(' ')
  let line = ''
  let offsetY = 0
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const testWidth = font.widthOfTextAtSize(testLine, size)
    if (testWidth > maxWidth && i > 0) {
      page.drawText(line.trim(), { x, y: y - offsetY, size, font })
      line = words[i] + ' '
      offsetY += 14
    } else {
      line = testLine
    }
  }
  if (line.trim()) page.drawText(line.trim(), { x, y: y - offsetY, size, font })
  return y - offsetY - 16
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
      const sideMargin = 50
      let page = pdfDoc.addPage(pageSize)
      let y = page.getHeight() - 50

      // Bandeau rouge ORPI
      page.drawRectangle({ x: 25, y: page.getHeight() - 60, width: 140, height: 30, color: rgb(1, 0, 0) })
      page.drawText('ORPI Adimmo', {
        x: 40,
        y: page.getHeight() - 42,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      })

      // Titre principal
      page.drawText('RAPPORT DE VISITE', {
        x: 200,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40

      const addLine = (label: string, value: string) => {
        y = drawWrappedText(page, `${sanitizeText(label)} ${sanitizeText(value)}`, sideMargin, y, page.getWidth() - 2 * sideMargin - 15, font, 12)
      }

      // Infos générales
      addLine('Date :', visitData.date)
      addLine('Adresse :', visitData.address)
      addLine('Rédacteur :', visitData.redacteur)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine('Code :', visitData.buildingCode)
      addLine('Personnes présentes :', visitData.personnesPresentes)

      // Photo principale - rester en bas de la 1ère page
      if (photoCopro) {
        const imageBitmap = await createImageBitmap(photoCopro)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        const maxWidth = page.getWidth() - 2 * sideMargin
        const availableHeight = Math.max(120, y - 60)
        const scaleToFit = Math.min(maxWidth / imageBitmap.width, availableHeight / imageBitmap.height, 0.6)

        canvas.width = imageBitmap.width * scaleToFit
        canvas.height = imageBitmap.height * scaleToFit
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

        const compressedBlob: Blob = await new Promise(resolve =>
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.5)
        )
        const arrayBuffer = await compressedBlob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const img = await pdfDoc.embedJpg(uint8Array)

        const drawWidth = canvas.width
        const drawHeight = canvas.height

        page.drawImage(img, {
          x: (page.getWidth() - drawWidth) / 2,
          y: y - drawHeight,
          width: drawWidth,
          height: drawHeight,
        })
        y -= drawHeight + 20
      }

      // --- Observations (inchangé) ---
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        page = pdfDoc.addPage(pageSize)
        y = page.getHeight() - 50

        const orpiWidth = 120
        const orpiHeight = 25
        page.drawRectangle({ x: sideMargin, y: y + 10, width: orpiWidth, height: orpiHeight, color: rgb(1, 0, 0) })
        page.drawText('ORPI Adimmo', {
          x: sideMargin + 5,
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
        page.drawRectangle({ x: sideMargin, y: y, width: bannerWidth, height: bannerHeight, color: rgb(1, 0, 0) })
        page.drawText(bannerText, {
          x: sideMargin + (bannerWidth - fontBold.widthOfTextAtSize(bannerText, textSize)) / 2,
          y: y + 8,
          size: textSize,
          font: fontBold,
          color: rgb(1, 1, 1),
        })
        y -= bannerHeight + 20

        const type = sanitizeText(obs.type)
        const description = sanitizeText(obs.description)
        const action = sanitizeText(obs.action || '')
        const isPositive = type.toLowerCase().includes('positive')
        const titleColor = isPositive ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)

        page.drawText(`Observation ${i + 1} - ${type}`, { x: sideMargin, y, size: 16, font: fontBold, color: titleColor })
        y -= 25

        page.drawText('Description :', { x: sideMargin, y, size: 14, font: fontBold })
        y -= 20
        y = drawWrappedText(page, description, sideMargin, y, page.getWidth() - 2 * sideMargin - 15, font, 12)

        if (action) {
          y -= 10
          page.drawText('Action à mener :', { x: sideMargin, y, size: 14, font: fontBold })
          y -= 20
          y = drawWrappedText(page, action, sideMargin, y, page.getWidth() - 2 * sideMargin - 15, font, 12)
        }
      }

      // --- Validation ---
      const lastPage = pdfDoc.addPage(pageSize)
      y = lastPage.getHeight() - 80
      lastPage.drawText('Validation du rapport', {
        x: sideMargin,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40
      lastPage.drawText(visitData.redacteur, { x: sideMargin, y, size: 14, font })
      y -= 20
      lastPage.drawText('Gestionnaire de copropriété', {
        x: sideMargin,
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
          x: sideMargin,
          y: y - sigScaled.height,
          width: sigScaled.width,
          height: sigScaled.height,
        })
      }

      // --- Sauvegarde & lien public ---
      const pdfBytes = await pdfDoc.save()
      const fileName = `rapport_${cleanFileName(visitData.address)}_${visitData.date}.pdf`
      const formData = new FormData()
      formData.append('filename', fileName)
      formData.append('file', new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), fileName)

      const uploadRes = await fetch('/api/save-pdf', { method: 'POST', body: formData })
      const { data, error } = await uploadRes.json()
      if (error) throw new Error(error)
      const publicUrl = data?.publicUrl

      // --- Envoi par mail avec lien public ---
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
          pdfUrl: publicUrl,
        }),
      })

      // --- Téléchargement local ---
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
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
