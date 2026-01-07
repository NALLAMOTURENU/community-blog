import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { HeroSection } from '@/components/sections/hero-section'
import { FeaturesGrid } from '@/components/sections/features-grid'
import { TrendingRooms } from '@/components/sections/trending-rooms'

export default async function Home() {
  // Check if user is authenticated on the server
  // This ensures UI reflects actual auth state from the start
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="bg-neutral-950 text-neutral-300 min-h-screen">
      {/* Ambient background glows */}
      <AmbientBackground />
      
      {/* Main content wrapper */}
      <div className="relative z-10">
        {/* Pass auth state to Navbar so it shows correct buttons */}
        <Navbar isAuthenticated={!!user} />
        <main className="pt-24 pb-20">
          <HeroSection isAuthenticated={!!user} />
          <FeaturesGrid />
          <TrendingRooms />
        </main>
        <Footer />
      </div>
    </div>
  )
}
