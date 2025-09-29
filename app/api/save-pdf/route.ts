import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Attention, pas la clé anon ici
)

export async function POST(req: NextRequest) {
  try {
    const { filename, file, mimetype } = await req.json()

    const buffer = Buffer.from(file, 'base64')

    const { error } = await supabase.storage
      .from('rapports-visite')
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: true,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
