'use client'

import { useState } from 'react'
import VisitForm from '../components/VisitForm'
import ObservationForm from '../components/ObservationForm'
import SignaturePad from '../components/SignaturePad'
import GeneratePDF from '../components/GeneratePDF'

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

  return (
    <main className="min-h-screen bg-gray-50 pb-20 px-4 space-y-10">
      <VisitForm visitData={visitData} setVisitData={setVisitData} />
      <ObservationForm />
      <SignaturePad />
      <GeneratePDF visitData={visitData} />
    </main>
  )
}
