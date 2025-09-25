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
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setVisitData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={visitData.date}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
        />
      </div>

      {/* Adresse */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input
          type="text"
          name="address"
          value={visitData.address}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          placeholder="Ex : 12 rue Victor Hugo"
        />
      </div>

      {/* Rédacteur */}
      <div>
        <label htmlFor="redacteur" className="block text-sm font-medium text-gray-700 mb-1">Rédacteur</label>
        <select
          name="redacteur"
          value={visitData.redacteur}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md bg-white"
        >
          <option value="">-- Sélectionner --</option>
          <option value="Elodie BONNAY">Elodie BONNAY</option>
          <option value="David SAINT-GERMAIN">David SAINT-GERMAIN</option>
          <option value="Samuel KITA">Samuel KITA</option>
        </select>
      </div>

      {/* Heure d'arrivée */}
      <div>
        <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-1">Heure d'arrivée</label>
        <input
          type="text"
          name="arrivalTime"
          value={visitData.arrivalTime}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          placeholder="Ex : 09h00"
        />
      </div>

      {/* Heure de départ */}
      <div>
        <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">Heure de départ</label>
        <input
          type="text"
          name="departureTime"
          value={visitData.departureTime}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          placeholder="Ex : 10h30"
        />
      </div>

      {/* Code immeuble */}
      <div>
        <label htmlFor="buildingCode" className="block text-sm font-medium text-gray-700 mb-1">Code immeuble</label>
        <input
          type="text"
          name="buildingCode"
          value={visitData.buildingCode}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          placeholder="Ex : 258B"
        />
      </div>

      {/* Personnes présentes */}
      <div className="md:col-span-2">
        <label htmlFor="personnesPresentes" className="block text-sm font-medium text-gray-700 mb-1">Personnes présentes</label>
        <textarea
          name="personnesPresentes"
          value={visitData.personnesPresentes}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          rows={3}
          placeholder="Ex : Mme Dupont, M. Leblanc"
        />
      </div>
    </div>
  )
}
