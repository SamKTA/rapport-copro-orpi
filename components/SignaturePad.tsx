'use client'

import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'

export default function SignaturePad() {
  const sigRef = useRef<SignatureCanvas>(null)

  const handleClear = () => {
    sigRef.current?.clear()
  }

  return (
    <section className="bg-white shadow-lg rounded-2xl p-8 max-w-2xl mx-auto mt-10 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">✍️ Signature du rédacteur</h2>

      <div className="border rounded-md overflow-hidden shadow">
        <SignatureCanvas
          penColor="black"
          canvasProps={{ width: 500, height: 150, className: "bg-white" }}
          ref={sigRef}
        />
      </div>

      <button onClick={handleClear} type="button" className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
        🧹 Effacer la signature
      </button>
    </section>
  )
}
