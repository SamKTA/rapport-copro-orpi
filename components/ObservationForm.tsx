'use client'

import { useState } from 'react'

type Observation = {
  type: string
  description: string
  action: string
  photos: File[]
}

export default function ObservationForm() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [form, setForm] = useState({
    type: '✅ Positive',
    description: '',
    action: '',
    photos: [] as File[],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).slice(0, 3)
    setForm({ ...form, photos: files })
  }

  const handleAddObservation = () => {
    if (!form.description) return alert('Merci de remplir une description.')
    setObservations([...observations, form])
    setForm({ type: '✅ Positive', description: '', action: '', photos: [] })
  }

  return (
    <section className="bg-white shadow-lg rounded-2xl p-8 max-w-2xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Observations</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'observation</label>
          <select name="type" value={form.type} onChange={handleChange} className="input">
            <option>✅ Positive</option>
            <option>❌ À améliorer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={3}></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action à mener (facultatif)</label>
          <textarea name="action" value={form.action} onChange={handleChange} className="input" rows={2}></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (max 3)</label>
          <input type="file" multiple accept="image/*" onChange={handlePhotoChange} className="input" />
        </div>

        <button type="button" onClick={handleAddObservation} className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 transition">
          ➕ Ajouter l'observation
        </button>
      </div>

      {observations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Liste des observations</h3>
          <ul className="space-y-4">
            {observations.map((obs, index) => (
              <li key={index} className="border p-4 rounded-md bg-gray-50">
                <p><strong>Type :</strong> {obs.type}</p>
                <p><strong>Description :</strong> {obs.description}</p>
                {obs.action && <p><strong>Action :</strong> {obs.action}</p>}
                {obs.photos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {obs.photos.map((photo, i) => (
                      <img key={i} src={URL.createObjectURL(photo)} alt={`obs-${index}-photo-${i}`} className="h-20 w-auto rounded" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
