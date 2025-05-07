import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error listing users:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    const emailMap: Record<string, string> = {}
    
    users.forEach(user => {
      if (user.email) {
        emailMap[user.id] = user.email
      }
    })

    return Response.json({ users: emailMap })
  } catch (error: any) {
    console.error('List all users error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
} 