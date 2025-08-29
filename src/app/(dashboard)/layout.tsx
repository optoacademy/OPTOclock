import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QueryProvider from '@/components/providers/query-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // In a real app, you would fetch user's role and organization here
  // and potentially have a shared sidebar or header component.

  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        {/* <aside className="w-64 bg-gray-100 p-4">
          <p>Sidebar</p>
          <p>User: {user.email}</p>
        </aside> */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </QueryProvider>
  )
}
