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
    <section className="bg-white shadow-lg rounded-2xl p-8 max-w-2xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Informations générales</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date de la visite</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🏠 Adresse</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="input" placeholder="Ex : 24 rue Victor Hugo, Limoges" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">✍️ Rédacteur</label>
          <select name="redacteur" value={formData.redacteur} onChange={handleChange} className="input">
            <option value="">-- Choisir --</option>
            <option value="David SAINT-GERMAIN">David SAINT-GERMAIN</option>
            <option value="Elodie BONNAY">Elodie BONNAY</option>
            <option value="Samuel KITA">Samuel KITA</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🕘 Heure d'arrivée</label>
            <input type="text" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className="input" placeholder="Ex : 09h15" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🕥 Heure de départ</label>
            <input type="text" name="departureTime" value={formData.departureTime} onChange={handleChange} className="input" placeholder="Ex : 10h30" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🔐 Code immeuble</label>
          <input type="text" name="buildingCode" value={formData.buildingCode} onChange={handleChange} className="input" placeholder="Ex : 159B" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">👥 Personnes présentes</label>
          <textarea name="personnesPresentes" value={formData.personnesPresentes} onChange={handleChange} className="input" rows={3} placeholder="Ex : M. Dupont (propriétaire), Mme Durant (syndic bénévole)" />
        </div>
      </div>
    </section>
  )
}
