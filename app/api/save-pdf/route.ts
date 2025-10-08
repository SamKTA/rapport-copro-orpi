import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const fileName = formData.get('filename') as string

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.storage
    .from('pdfs')
    .upload(fileName, file, { upsert: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // 🔗 On génère l'URL publique
  const { data: publicData } = supabase.storage.from('pdfs').getPublicUrl(fileName)

  return new Response(JSON.stringify({ data: { publicUrl: publicData.publicUrl } }), { status: 200 })
}
