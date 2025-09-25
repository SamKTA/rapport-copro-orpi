import VisitForm from '../components/VisitForm'
import ObservationForm from '../components/ObservationForm'
import SignaturePad from '../components/SignaturePad'
import GeneratePDF from '../components/GeneratePDF'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-10 py-10">
        {/* Formulaire de visite */}
        <VisitForm />

        {/* Observations */}
        <ObservationForm />

        {/* Signature */}
        <SignaturePad />

        {/* Bouton pour générer le PDF */}
        <GeneratePDF />
      </div>
    </main>
  )
}
