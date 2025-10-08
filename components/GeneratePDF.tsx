"use client"

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { useState } from "react"

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[…]/g, "...")
    .replace(/[–—]/g, "-")
    .trim()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1]
      resolve(base64data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function cleanFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
}

export default function GeneratePDF({
  visitData,
  observations,
  signatureDataURL,
  photoCopro,
}: Props) {
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

      // Bandeau rouge ORPI
      page.drawRectangle({
        x: 25,
        y: page.getHeight() - 60,
        width: 140,
        height: 30,
        color: rgb(1, 0, 0),
      })
      page.drawText("ORPI Adimmo", {
        x: 40,
        y: page.getHeight() - 42,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      })

      // Titre principal
      page.drawText("RAPPORT DE VISITE", {
        x: 200,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40

      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, font: any, size: number) => {
        const words = text.split(" ")
        let line = ""
        let offsetY = 0
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " "
          const testWidth = font.widthOfTextAtSize(testLine, size)
          if (testWidth > maxWidth && n > 0) {
            page.drawText(line.trim(), { x, y: y - offsetY, size, font })
            line = words[n] + " "
            offsetY += 14
          } else {
            line = testLine
          }
        }
        if (line.length > 0) page.drawText(line.trim(), { x, y: y - offsetY, size, font })
        return y - offsetY - 16
      }

      const addLine = (label: string, value: string) => {
        y = addWrappedText(`${sanitizeText(label)} ${sanitizeText(value)}`, 50, y, 480, font, 12)
      }

      // Infos générales
      addLine("Date :", visitData.date)
      addLine("Adresse :", visitData.address)
      addLine("Rédacteur :", visitData.redacteur)
      addLine("Heure d'arrivée :", visitData.arrivalTime)
      addLine("Heure de départ :", visitData.departureTime)
      addLine("Code :", visitData.buildingCode)
      addLine("Personnes présentes :", visitData.personnesPresentes)

      y -= 60

      // Photo copro
      if (photoCopro) {
        const imgBytes = await photoCopro.arrayBuffer()
        let img
        if (photoCopro.type.includes("png") || photoCopro.name.toLowerCase().endsWith(".png")) {
          img = await pdfDoc.embedPng(new Uint8Array(imgBytes))
        } else {
          img = await pdfDoc.embedJpg(new Uint8Array(imgBytes))
        }
        const scaled = img.scale(0.5)
        if (y - scaled.height < 50) {
          page = pdfDoc.addPage(pageSize)
          y = page.getHeight() - 100
        }
        page.drawImage(img, {
          x: (page.getWidth() - scaled.width) / 2,
          y: y - scaled.height,
          width: scaled.width,
          height: scaled.height,
        })
        y -= scaled.height + 20
      }

      // Observations
      for (let i = 0; i < observations.length; i++) {
        const obs = observations[i]
        page = pdfDoc.addPage(pageSize)
        y = page.getHeight() - 60

        // Bandeau
        page.drawRectangle({
          x: 50,
          y: y + 10,
          width: 120,
          height: 25,
          color: rgb(1, 0, 0),
        })
        page.drawText("ORPI Adimmo", {
          x: 55,
          y: y + 18,
          size: 12,
          font: fontBold,
          color: rgb(1, 1, 1),
        })

        const bannerText = "OBSERVATIONS"
        const bannerHeight = 30
        const bannerWidth = 500
        y -= 20
        page.drawRectangle({ x: 50, y: y, width: bannerWidth, height: bannerHeight, color: rgb(1, 0, 0) })
        page.drawText(bannerText, {
          x: 50 + (bannerWidth - fontBold.widthOfTextAtSize(bannerText, 14)) / 2,
          y: y + 8,
          size: 14,
          font: fontBold,
          color: rgb(1, 1, 1),
        })
        y -= bannerHeight + 25

        const type = sanitizeText(obs.type)
        const description = sanitizeText(obs.description)
        const action = sanitizeText(obs.action || "")
        const isPositive = type.toLowerCase().includes("positive")
        const titleColor = isPositive ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)

        // Texte
        page.drawText(`Observation ${i + 1} - ${type}`, {
          x: 50,
          y,
          size: 16,
          font: fontBold,
          color: titleColor,
        })
        y -= 25

        page.drawText("Description :", { x: 50, y, size: 14, font: fontBold })
        y -= 20
        y = addWrappedText(description, 50, y, 480, font, 12)

        if (action) {
          y -= 10
          page.drawText("Action à mener :", { x: 50, y, size: 14, font: fontBold })
          y -= 20
          y = addWrappedText(action, 50, y, 480, font, 12)
        }

        // Photos
        if (obs.photos?.length) {
          y -= 30
          const photos = obs.photos
          const embedImage = async (photo: File) => {
            const imgBytes = await photo.arrayBuffer()
            return photo.type.includes("png") || photo.name.toLowerCase().endsWith(".png")
              ? await pdfDoc.embedPng(new Uint8Array(imgBytes))
              : await pdfDoc.embedJpg(new Uint8Array(imgBytes))
          }

          if (photos.length === 1) {
            const img = await embedImage(photos[0])
            const scaled = img.scale(0.5)
            page.drawImage(img, {
              x: (page.getWidth() - scaled.width) / 2,
              y: y - scaled.height,
              width: scaled.width,
              height: scaled.height,
            })
          } else if (photos.length === 2) {
            const spacing = 25
            const scaledImages = []
            for (const p of photos) {
              const img = await embedImage(p)
              scaledImages.push(img.scale(0.4))
            }
            const totalWidth = scaledImages[0].width + scaledImages[1].width + spacing
            let startX = (page.getWidth() - totalWidth) / 2
            for (let i = 0; i < 2; i++) {
              const img = scaledImages[i]
              page.drawImage(img, {
                x: startX,
                y: y - img.height,
                width: img.width,
                height: img.height,
              })
              startX += img.width + spacing
            }
          } else if (photos.length === 3) {
            const img1 = await embedImage(photos[0])
            const scaled1 = img1.scale(0.45)
            page.drawImage(img1, {
              x: (page.getWidth() - scaled1.width) / 2,
              y: y - scaled1.height,
              width: scaled1.width,
              height: scaled1.height,
            })
            y -= scaled1.height + 25

            const img2 = await embedImage(photos[1])
            const img3 = await embedImage(photos[2])
            const scaled2 = img2.scale(0.35)
            const scaled3 = img3.scale(0.35)
            const spacing = 30
            const totalWidth = scaled2.width + scaled3.width + spacing
            let startX = (page.getWidth() - totalWidth) / 2
            page.drawImage(img2, {
              x: startX,
              y: y - scaled2.height,
              width: scaled2.width,
              height: scaled2.height,
            })
            startX += scaled2.width + spacing
            page.drawImage(img3, {
              x: startX,
              y: y - scaled3.height,
              width: scaled3.width,
              height: scaled3.height,
            })
          }
        }
      }

      // Page validation
      const lastPage = pdfDoc.addPage(pageSize)
      y = lastPage.getHeight() - 80
      lastPage.drawText("Validation du rapport", {
        x: 50,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      y -= 40
      lastPage.drawText(visitData.redacteur, { x: 50, y, size: 14, font })
      y -= 20
      lastPage.drawText("Gestionnaire de copropriété", {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })
      y -= 40

      if (signatureDataURL) {
        const sigBytes = await fetch(signatureDataURL).then((r) => r.arrayBuffer())
        const sigImg = await pdfDoc.embedPng(sigBytes)
        const scaledSig = sigImg.scale(0.5)
        lastPage.drawImage(sigImg, {
          x: 50,
          y: y - scaledSig.height,
          width: scaledSig.width,
          height: scaledSig.height,
        })
      }

      // Envoi + sauvegarde
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
      const base64 = await blobToBase64(blob)
      const recipient =
        visitData.redacteur === "Elodie BONNAY"
          ? "ebonnay@orpi.com"
          : visitData.redacteur === "David SAINT-GERMAIN"
          ? "dsaintgermain@orpi.com"
          : "skita@orpi.com"

      await fetch("/api/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          address: visitData.address,
          date: visitData.date,
          pdfBase64: base64,
        }),
      })

      const fileName = `rapport_${cleanFileName(visitData.address)}_${visitData.date}.pdf`
      const formData = new FormData()
      formData.append("filename", fileName)
      formData.append("file", new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), fileName)
      await fetch("/api/save-pdf", { method: "POST", body: formData })

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "rapport-visite.pdf"
      link.click()

      setSuccess(true)
    } catch (err: any) {
      console.error("Erreur détaillée :", err)
      alert(`Erreur lors de la génération : ${err.message || "voir console"}`)
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
        {loading ? "Génération en cours..." : "📄 Générer le rapport PDF"}
      </button>
      {success && (
        <p className="text-green-600 font-medium">
          ✅ Rapport généré, envoyé par email et sauvegardé sur Supabase
        </p>
      )}
    </div>
  )
}
