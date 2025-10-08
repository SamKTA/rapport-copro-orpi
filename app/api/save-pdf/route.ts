import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('filename') as string

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Fichier ou nom manquant' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 🟢 Upload du fichier dans le bucket “pdfs”
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 🔗 Génération de l’URL publique
    const { data: publicData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(fileName)

    return NextResponse.json({
      data: { publicUrl: publicData.publicUrl },
    })
  } catch (err: any) {
    console.error('Erreur serveur /api/save-pdf:', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
