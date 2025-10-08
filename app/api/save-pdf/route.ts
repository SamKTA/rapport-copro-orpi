import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json({ error: 'Fichier ou nom manquant' }, { status: 400 })
    }

    // Connexion à Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload dans le bucket "rapports-visite"
    const { data, error } = await supabase.storage
      .from('rapports-visite')
      .upload(filename, file, { upsert: true, contentType: 'application/pdf' })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ✅ Construction de l’URL publique complète
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rapports-visite/${encodeURIComponent(filename)}`

    console.log('✅ Rapport sauvegardé :', publicUrl)
    return NextResponse.json({ data: { publicUrl } })
  } catch (err: any) {
    console.error('Erreur dans /api/save-pdf :', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
