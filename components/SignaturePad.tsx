'use client'

import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'

interface Props {
  setSignatureData: (dataURL: string) => void
}

export default function SignaturePad({ setSignatureData }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null)

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.toDataURL('image/png')
      setSignatureData(dataURL)
    } else {
      alert("Veuillez signer avant de sauvegarder.")
    }
  }

  const handleClear = () => {
    sigRef.current?.clear()
    setSignatureData('')
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-md">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          backgroundColor="white"
          canvasProps={{
            width: 500,
            height: 200,
            className: 'w-full rounded-md'
          }}
        />
      </div>

      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
        >
          Effacer
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
        >
          Sauvegarder la signature
        </button>
      </div>
    </div>
  )
}
