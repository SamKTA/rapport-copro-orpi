'use client'

import { useState, ChangeEvent, FormEvent } from 'react'

interface Observation {
  type: string
  description: string
  action?: string
  photos: File[]
}

interface Props {
  observations: Observation[]
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>
}

export default function ObservationForm({ observations, setObservations }: Props) {
  const [form, setForm] = useState<Observation>({
    type: '✅ Positive',
    description: '',
    action: '',
    photos: []
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).slice(0, 3)
    setForm({ ...form, photos: files })
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!form.description) return alert('Ajoute une description.')
    setObservations([...observations, form])
    setForm({ type: '✅ Positive', description: '', action: '', photos: [] })
  }

  return (
    <form onSubmit={handleAdd} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md bg-white"
        >
          <option value="✅ Positive">✅ Positive</option>
          <option value="❌ A améliorer">❌ A améliorer</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Action à mener (facultatif)</label>
        <textarea
          name="action"
          value={form.action}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-md"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Photos (max 3)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotos}
          className="w-full border border-gray-300 p-2 rounded-md"
        />
      </div>

      <button
        type="submit"
        className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
      >
        ➕ Ajouter l'observation
      </button>

      {observations.length > 0 && (
        <div className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">📋 Observations ajoutées</h3>
          <ul className="space-y-4">
            {observations.map((obs, index) => (
              <li key={index} className="border p-4 rounded-md bg-gray-50">
                <p><strong>Type :</strong> {obs.type}</p>
                <p><strong>Description :</strong> {obs.description}</p>
                {obs.action && <p><strong>Action :</strong> {obs.action}</p>}
                {obs.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {obs.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(photo)}
                        alt={`obs-${index}-photo-${i}`}
                        className="h-20 rounded"
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
