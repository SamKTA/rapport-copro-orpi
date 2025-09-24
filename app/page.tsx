import VisitForm from '../components/VisitForm'
import ObservationForm from '../components/ObservationForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <VisitForm />
      <ObservationForm />
    </main>
  )
}
