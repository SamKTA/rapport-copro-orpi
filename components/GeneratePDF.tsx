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

      // --- En-tête ORPI ---
      page.drawRectangle({ x: 25, y: page.getHeight() - 60, width: 140, height: 30, color: rgb(1, 0, 0) })
      page.drawText('ORPI Adimmo', {
        x: 40,
        y: page.getHeight() - 42,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      })

      page.drawText('RAPPORT DE VISITE', { x: 200, y, size: 18, font: fontBold })
      y -= 40

      const addLine = (label: string, value: string) => {
        y = drawWrappedText(page, `${sanitizeText(label)} ${sanitizeText(value)}`, sideMargin, y, page.getWidth() - 2 * sideMargin, font, 12)
      }

      // --- Infos générales ---
      addLine('Date :', visitData.date)
      addLine('Adresse :', visitData.address)
      addLine('Rédacteur :', visitData.redacteur)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine('Code :', visitData.buildingCode)
      addLine('Personnes présentes :', visitData.personnesPresentes)

      // --- Photo copro ---
      if (photoCopro) {
        const imageBitmap = await createImageBitmap(photoCopro)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const maxWidth = page.getWidth() - 2 * sideMargin
        const availableHeight = Math.max(120, y - 60)
        const scale = Math.min(maxWidth / imageBitmap.width, availableHeight / imageBitmap.height, 0.6)
        canvas.width = imageBitmap.width * scale
        canvas.height = imageBitmap.height * scale
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
        const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.5))
        const img = await pdfDoc.embedJpg(await blob.arrayBuffer())
        page.drawImage(img, { x: (page.getWidth() - canvas.width) / 2, y: y - canvas.height, width: canvas.width, height: canvas.height })
        y -= canvas.height + 20
      }

      // --- Observations ---
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        page = pdfDoc.addPage(pageSize)
        y = page.getHeight() - 50

        // En-tête
        const orpiWidth = 120
        const orpiHeight = 25
        page.drawRectangle({ x: sideMargin, y: y + 10, width: orpiWidth, height: orpiHeight, color: rgb(1, 0, 0) })
        page.drawText('ORPI Adimmo', { x: sideMargin + 5, y: y + 18, size: 12, font: fontBold, color: rgb(1, 1, 1) })

        const bannerText = 'OBSERVATIONS'
        const bannerHeight = 30
        const bannerWidth = 500
        y -= 20
        page.drawRectangle({ x: sideMargin, y, width: bannerWidth, height: bannerHeight, color: rgb(1, 0, 0) })
        page.drawText(bannerText, {
          x: sideMargin + (bannerWidth - fontBold.widthOfTextAtSize(bannerText, 14)) / 2,
          y: y + 8,
          size: 14,
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
        y = drawWrappedText(page, description, sideMargin, y, page.getWidth() - 2 * sideMargin, font, 12)

        if (action) {
          y -= 10
          page.drawText('Action à mener :', { x: sideMargin, y, size: 14, font: fontBold })
          y -= 20
          y = drawWrappedText(page, action, sideMargin, y, page.getWidth() - 2 * sideMargin, font, 12)
        }

        // --- Page dédiée aux photos ---
        if (obs.photos?.length) {
          const photoPage = pdfDoc.addPage(pageSize)
          const pw = photoPage.getWidth()
          const ph = photoPage.getHeight()
          const top = ph - 80
          const margin = sideMargin
          const gap = 30

          const embedImage = async (file: File) => {
            const bytes = await file.arrayBuffer()
            return file.type.includes('png')
              ? pdfDoc.embedPng(new Uint8Array(bytes))
              : pdfDoc.embedJpg(new Uint8Array(bytes))
          }

          if (obs.photos.length === 1) {
            const img = await embedImage(obs.photos[0])
            const scale = Math.min((pw - 2 * margin) / img.width, 0.6)
            photoPage.drawImage(img, {
              x: (pw - img.width * scale) / 2,
              y: top - img.height * scale,
              width: img.width * scale,
              height: img.height * scale,
            })
          } else if (obs.photos.length === 2) {
            const img1 = await embedImage(obs.photos[0])
            const img2 = await embedImage(obs.photos[1])
            const colW = (pw - 2 * margin - gap) / 2
            const s1 = Math.min(colW / img1.width, 0.6)
            const s2 = Math.min(colW / img2.width, 0.6)
            const h = Math.max(img1.height * s1, img2.height * s2)
            const yRow = top - h
            photoPage.drawImage(img1, { x: margin, y: yRow, width: img1.width * s1, height: img1.height * s1 })
            photoPage.drawImage(img2, { x: margin + colW + gap, y: yRow, width: img2.width * s2, height: img2.height * s2 })
          } else if (obs.photos.length >= 3) {
            const [p1, p2, p3] = obs.photos
            const img1 = await embedImage(p1)
            const img2 = await embedImage(p2)
            const img3 = await embedImage(p3)
            const s1 = Math.min((pw - 2 * margin) / img1.width, 0.5)
            const y1 = top - img1.height * s1
            photoPage.drawImage(img1, { x: (pw - img1.width * s1) / 2, y: y1, width: img1.width * s1, height: img1.height * s1 })

            const colW = (pw - 2 * margin - gap) / 2
            const s2 = Math.min(colW / img2.width, 0.45)
            const s3 = Math.min(colW / img3.width, 0.45)
            const h = Math.max(img2.height * s2, img3.height * s3)
            const y2 = y1 - h - gap
            photoPage.drawImage(img2, { x: margin, y: y2, width: img2.width * s2, height: img2.height * s2 })
            photoPage.drawImage(img3, { x: margin + colW + gap, y: y2, width: img3.width * s3, height: img3.height * s3 })
          }
        }
      }

      // --- Page de validation ---
      const lastPage = pdfDoc.addPage(pageSize)
      y = lastPage.getHeight() - 80
      lastPage.drawText('Validation du rapport', { x: sideMargin, y, size: 18, font: fontBold })
      y -= 40
      lastPage.drawText(visitData.redacteur, { x: sideMargin, y, size: 14, font })
      y -= 20
      lastPage.drawText('Gestionnaire de copropriété', { x: sideMargin, y, size: 12, font })

      if (signatureDataURL) {
        const signatureBytes = await fetch(signatureDataURL).then(res => res.arrayBuffer())
        const signatureImg = await pdfDoc.embedPng(signatureBytes)
        const sigScaled = signatureImg.scale(0.5)
        lastPage.drawImage(signatureImg, { x: sideMargin, y: y - sigScaled.height, width: sigScaled.width, height: sigScaled.height })
      }

      // --- Upload vers Supabase ---
      const pdfBytes = await pdfDoc.save()
      const fileName = `rapport_${cleanFileName(visitData.address)}_${visitData.date}.pdf`
      const formData = new FormData()
      formData.append('filename', fileName)
      formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), fileName)

      const uploadRes = await fetch('/api/save-pdf', { method: 'POST', body: formData })
      const { data } = await uploadRes.json()
      const publicUrl = data?.publicUrl

      // --- Envoi mail ---
      await fetch('/api/send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: visitData.redacteur === 'Elodie BONNAY'
            ? 'ebonnay@orpi.com'
            : visitData.redacteur === 'David SAINT-GERMAIN'
            ? 'dsaintgermain@orpi.com'
            : 'skita@orpi.com',
          address: visitData.address,
          date: visitData.date,
          pdfUrl: publicUrl,
        }),
      })

      // --- Téléchargement local ---
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'rapport-visite.pdf'
      link.click()

      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      alert(`Erreur : ${err.message}`)
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
      {success && <p className="text-green-600 font-medium">✅ Rapport généré et envoyé avec lien public</p>}
    </div>
  )
}
