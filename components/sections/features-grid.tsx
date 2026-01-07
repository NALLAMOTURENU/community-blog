import { Bot, Users, Zap, Database, Sparkles } from 'lucide-react'

export function FeaturesGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Power your creativity
          </h2>
          <p className="text-neutral-400 text-sm">
            Everything you need to build a thriving content community.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Large Card - AI-Powered Co-pilot */}
        <div className="md:col-span-2 glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-neutral-700 transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
            <Sparkles className="w-32 h-32 text-indigo-500" strokeWidth={1.5} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6 text-indigo-400">
              <Bot size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                AI-Powered Co-pilot
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
                Don&apos;t just write alone. Let our intelligent assistant suggest topics, refine your tone, and fix grammar in real-time as you draft your next masterpiece.
              </p>
            </div>
          </div>
        </div>

        {/* Tall Card - Community Rooms */}
        <div className="md:row-span-2 glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-neutral-700 transition-colors flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6 text-pink-400">
            <Users size={20} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Community Rooms
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Create dedicated spaces for specific topics. Moderate members, pin best posts, and grow your tribe.
          </p>
          
          {/* Visual representation of list */}
          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-white/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500"></div>
              <div className="h-2 w-20 bg-neutral-700 rounded-full"></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-white/5 translate-x-2 opacity-75">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
              <div className="h-2 w-16 bg-neutral-700 rounded-full"></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-white/5 translate-x-4 opacity-50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500"></div>
              <div className="h-2 w-24 bg-neutral-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Medium Card - Real-time Sync */}
        <div className="glass-card rounded-2xl p-8 group hover:border-neutral-700 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6 text-emerald-400">
            <Zap size={20} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Real-time Sync
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Powered by Supabase for instant updates. See who&apos;s online and typing.
          </p>
        </div>

        {/* Medium Card - Sanity CMS */}
        <div className="glass-card rounded-2xl p-8 group hover:border-neutral-700 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6 text-orange-400">
            <Database size={20} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Sanity CMS
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Structured content that scales. Your data is decoupled and ready for any frontend.
          </p>
        </div>
      </div>
    </section>
  )
}

