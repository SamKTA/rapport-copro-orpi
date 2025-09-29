'use client'

import { useState } from 'react'
import VisitForm from '../components/VisitForm'
import ObservationForm from '../components/ObservationForm'
import SignaturePad from '../components/SignaturePad'
import GeneratePDF from '../components/GeneratePDF'

interface Observation {
  type: string
  description: string
  action?: string
  photos: File[]
}

export default function Home() {
  const [visitData, setVisitData] = useState({
    date: '',
    address: '',
    redacteur: '',
    arrivalTime: '',
    departureTime: '',
    buildingCode: '',
    personnesPresentes: ''
  })

  const [photoCopro, setPhotoCopro] = useState<File | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined)

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-3xl mx-auto space-y-10 px-4">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">🗓️ Informations de visite</h2>
          <VisitForm visitData={visitData} setVisitData={setVisitData} />
        </div>

        {/* ✅ CHAMP PHOTO COPRO AJOUTÉ ICI */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">📷 Photo de la copropriété</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoCopro(e.target.files?.[0] || null)}
            className="block"
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">🔍 Observations</h2>
          <ObservationForm
            observations={observations}
            setObservations={setObservations}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">✍️ Signature du rédacteur</h2>
          <SignaturePad setSignatureData={setSignatureData} />
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-center">
          <GeneratePDF
            visitData={visitData}
            observations={observations}
            signatureDataURL={signatureData}
            photoCopro={photoCopro} // ✅ transmis ici
          />
        </div>
      </div>
    </main>
  )
}
