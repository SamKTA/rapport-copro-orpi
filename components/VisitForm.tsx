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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="date"
        name="date"
        value={visitData.date}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Date"
      />

      <input
        type="text"
        name="address"
        value={visitData.address}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Adresse"
      />

      <input
        type="text"
        name="redacteur"
        value={visitData.redacteur}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Rédacteur"
      />

      <input
        type="text"
        name="arrivalTime"
        value={visitData.arrivalTime}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Heure d'arrivée"
      />

      <input
        type="text"
        name="departureTime"
        value={visitData.departureTime}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Heure de départ"
      />

      <input
        type="text"
        name="buildingCode"
        value={visitData.buildingCode}
        onChange={handleChange}
        className="w-full border border-gray-300 p-3 rounded-md"
        placeholder="Code immeuble"
      />

      <textarea
        name="personnesPresentes"
        value={visitData.personnesPresentes}
        onChange={handleChange}
        className="w-full md:col-span-2 border border-gray-300 p-3 rounded-md"
        placeholder="Personnes présentes"
        rows={3}
      />
    </div>
  )
}
