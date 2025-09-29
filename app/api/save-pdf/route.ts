import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    console.log('📥 API /save-pdf appelée')

    const formData = await req.formData()
    console.log('✅ formData reçu')

    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    console.log('🧾 Fichier reçu :', filename)
    console.log('📁 Type de fichier :', file?.type)
    console.log('📦 Taille du fichier :', file?.size)

    if (!file || !filename) {
      console.log('❌ Données manquantes')
      return NextResponse.json({ error: 'Missing file or filename' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log('✅ Conversion en Uint8Array faite')

    const { error } = await supabase.storage
      .from('rapports-visite')
      .upload(filename, uint8Array, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error('❌ Erreur Supabase :', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Upload terminé avec succès')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Erreur API save-pdf :', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
