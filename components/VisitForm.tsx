'use client'

import { useState } from 'react'

export default function VisitForm() {
  const [formData, setFormData] = useState({
    date: '',
    address: '',
    redacteur: '',
    arrivalTime: '',
    departureTime: '',
    buildingCode: '',
    personnesPresentes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  return (
    <form className="space-y-4 p-4 bg-white rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-semibold">📝 Informations générales</h2>

      <div>
        <label className="block text-sm font-medium">Date de la visite</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Adresse</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Rédacteur</label>
        <select name="redacteur" value={formData.redacteur} onChange={handleChange} className="w-full border rounded px-3 py-2">
          <option value="">-- Choisir --</option>
          <option value="David SAINT-GERMAIN">David SAINT-GERMAIN</option>
          <option value="Elodie BONNAY">Elodie BONNAY</option>
          <option value="Samuel KITA">Samuel KITA</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Heure d'arrivée</label>
          <input type="text" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Heure de départ</label>
          <input type="text" name="departureTime" value={formData.departureTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Code immeuble</label>
        <input type="text" name="buildingCode" value={formData.buildingCode} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Personnes présentes</label>
        <textarea name="personnesPresentes" value={formData.personnesPresentes} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3}></textarea>
      </div>
    </form>
  )
}
