import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🛡️ attention à bien utiliser la clé "service role"
)

export async function POST(req: NextRequest) {
  try {
    const { base64, fileName, metadata } = await req.json()

    const buffer = Buffer.from(base64, 'base64')

    const { error } = await supabase.storage
      .from('rapports')
      .upload(`pdf/${fileName}`, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error('Erreur Supabase Storage:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur inconnue' }, { status: 500 })
  }
}
