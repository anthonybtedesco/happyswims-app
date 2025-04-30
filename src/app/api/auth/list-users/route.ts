import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return Response.json({ error: 'User IDs array is required' }, { status: 400 })
    }

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error listing users:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    const filteredUsers = users.filter(user => userIds.includes(user.id))
    const emailMap: Record<string, string> = {}
    
    filteredUsers.forEach(user => {
      if (user.email) {
        emailMap[user.id] = user.email
      }
    })

    return Response.json({ users: emailMap })
  } catch (error: any) {
    console.error('List users error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
} 