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
    .replace(/\r?\n|\r/g, ' ')
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

      // --- Bandeau ORPI ---
      page.drawRectangle({ x: 25, y: page.getHeight() - 60, width: 140, height: 30, color: rgb(1, 0, 0) })
      page.drawText('ORPI Adimmo', {
        x: 40,
        y: page.getHeight() - 42,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      })

      // --- Titre principal ---
      page.drawText('RAPPORT DE VISITE', {
        x: 200,
        y,
        size: 18,
        font: fontBold,
      })
      y -= 40

      const addLine = (label: string, value: string) => {
        y = drawWrappedText(page, `${sanitizeText(label)} ${sanitizeText(value)}`, sideMargin, y, page.getWidth() - 2 * sideMargin - 15, font, 12)
      }

      // --- Infos générales ---
      addLine('Date :', visitData.date)
      addLine('Adresse :', visitData.address)
      addLine('Rédacteur :', visitData.redacteur)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine('Code :', visitData.buildingCode)
      addLine('Personnes présentes :', visitData.personnesPresentes)

      // --- Photo principale ---
      if (photoCopro) {
        const imageBitmap = await createImageBitmap(photoCopro)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        // 🔧 Nouvelle limite stricte pour réduire la taille
        const maxWidth = 700
        const scale = Math.min(maxWidth / imageBitmap.width, 0.4)
        canvas.width = imageBitmap.width * scale
        canvas.height = imageBitmap.height * scale
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

        const compressedBlob: Blob = await new Promise(resolve =>
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.15)
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

      // --- Observations ---
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        page = pdfDoc.addPage(pageSize)
        y = page.getHeight() - 50

        // Bandeau section
        const bannerText = 'OBSERVATIONS'
        page.drawRectangle({ x: sideMargin, y: y - 10, width: 500, height: 30, color: rgb(1, 0, 0) })
        page.drawText(bannerText, {
          x: sideMargin + 190,
          y: y,
          size: 14,
          font: fontBold,
          color: rgb(1, 1, 1),
        })
        y -= 60

        // Texte observation
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

        // --- Photos observation (compressées) ---
        if (obs.photos?.length) {
          const photoPage = pdfDoc.addPage(pageSize)
          const pw = photoPage.getWidth()
          const ph = photoPage.getHeight()
          const margin = sideMargin
          const gap = 30
          const top = ph - 80

          const embedImage = async (file: File) => {
            const imgBitmap = await createImageBitmap(file)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const maxWidth = 700
            const scale = Math.min(maxWidth / imgBitmap.width, 0.4)
            canvas.width = imgBitmap.width * scale
            canvas.height = imgBitmap.height * scale
            ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height)
            const compressedBlob: Blob = await new Promise(resolve =>
              canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.15)
            )
            const arrBuf = await compressedBlob.arrayBuffer()
            return pdfDoc.embedJpg(new Uint8Array(arrBuf))
          }

          // 1, 2 ou 3 images (comme avant)
          if (obs.photos.length === 1) {
            const img = await embedImage(obs.photos[0])
            const w = img.width
            const h = img.height
            photoPage.drawImage(img, { x: (pw - w) / 2, y: top - h, width: w, height: h })
          } else if (obs.photos.length === 2) {
            const img1 = await embedImage(obs.photos[0])
            const img2 = await embedImage(obs.photos[1])
            const colW = (pw - 2 * margin - gap) / 2
            const w1 = img1.width, h1 = img1.height
            const w2 = img2.width, h2 = img2.height
            const yRow = top - Math.max(h1, h2)
            photoPage.drawImage(img1, { x: margin + (colW - w1) / 2, y: yRow, width: w1, height: h1 })
            photoPage.drawImage(img2, { x: margin + colW + gap + (colW - w2) / 2, y: yRow, width: w2, height: h2 })
          } else if (obs.photos.length >= 3) {
            const img1 = await embedImage(obs.photos[0])
            const img2 = await embedImage(obs.photos[1])
            const img3 = await embedImage(obs.photos[2])
            const w1 = img1.width, h1 = img1.height
            const w2 = img2.width, h2 = img2.height
            const w3 = img3.width, h3 = img3.height
            photoPage.drawImage(img1, { x: (pw - w1) / 2, y: top - h1, width: w1, height: h1 })
            const y2Top = top - h1 - gap - Math.max(h2, h3)
            photoPage.drawImage(img2, { x: margin, y: y2Top, width: w2, height: h2 })
            photoPage.drawImage(img3, { x: pw - margin - w3, y: y2Top, width: w3, height: h3 })
          }
        }
      }

      // --- Page signature ---
      const lastPage = pdfDoc.addPage(pageSize)
      y = lastPage.getHeight() - 80
      lastPage.drawText('Validation du rapport', { x: sideMargin, y, size: 18, font: fontBold })
      y -= 40
      lastPage.drawText(visitData.redacteur, { x: sideMargin, y, size: 14, font })
      y -= 20
      lastPage.drawText('Gestionnaire de copropriété', { x: sideMargin, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) })
      y -= 40

      if (signatureDataURL) {
        const signatureBytes = await fetch(signatureDataURL).then(res => res.arrayBuffer())
        const signatureImg = await pdfDoc.embedPng(signatureBytes)
        const sigScaled = signatureImg.scale(0.5)
        lastPage.drawImage(signatureImg, { x: sideMargin, y: y - sigScaled.height, width: sigScaled.width, height: sigScaled.height })
      }

      // --- Envoi et sauvegarde ---
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
        body: JSON.stringify({ to: recipient, address: visitData.address, date: visitData.date, pdfBase64: base64 }),
      })

      const fileName = `rapport_${cleanFileName(visitData.address)}_${visitData.date}.pdf`
      const formData = new FormData()
      formData.append('filename', fileName)
      formData.append('file', new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), fileName)
      await fetch('/api/save-pdf', { method: 'POST', body: formData })

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
