import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to Fichaje SaaS
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        The modern time clocking solution for your business.
      </p>
      <div>
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  )
}
