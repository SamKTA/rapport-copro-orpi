'use client'

import { ChangeEvent } from 'react'

interface VisitData {
  date: string
  address: string
  redacteur: string
  arrivalTime: string
  departureTime: string
  buildingCode: string
  personnesPresentes: string
}

interface VisitFormProps {
  visitData: VisitData
  setVisitData: React.Dispatch<React.SetStateAction<VisitData>>
}

export default function VisitForm({ visitData, setVisitData }: VisitFormProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setVisitData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form className="space-y-4 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold text-gray-800">Informations de visite</h2>

      <input
        type="date"
        name="date"
        value={visitData.date}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Date"
      />

      <input
        type="text"
        name="address"
        value={visitData.address}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Adresse"
      />

      <input
        type="text"
        name="redacteur"
        value={visitData.redacteur}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Rédacteur"
      />

      <input
        type="text"
        name="arrivalTime"
        value={visitData.arrivalTime}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Heure d'arrivée"
      />

      <input
        type="text"
        name="departureTime"
        value={visitData.departureTime}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Heure de départ"
      />

      <input
        type="text"
        name="buildingCode"
        value={visitData.buildingCode}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Code immeuble"
      />

      <textarea
        name="personnesPresentes"
        value={visitData.personnesPresentes}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Personnes présentes"
        rows={3}
      />
    </form>
  )
}
