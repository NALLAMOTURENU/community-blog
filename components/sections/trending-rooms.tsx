'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'

export function TrendingRooms() {
  // Mock data for trending rooms - in a real app, this would come from your backend
  const rooms = [
    {
      id: 1,
      category: 'Design',
      categoryColor: 'purple',
      title: 'Frontend Architecture',
      description: 'Discussing the best practices for React Server Components and state management.',
      liveCount: 12,
      members: 3,
      extraMembers: 5,
      updatedAt: '2m ago',
    },
    {
      id: 2,
      category: 'Tech',
      categoryColor: 'blue',
      title: 'AI Prompt Engineering',
      description: 'Sharing the latest prompts for GPT-4 and Midjourney. Let\'s build together.',
      liveCount: 8,
      members: 2,
      extraMembers: 0,
      updatedAt: '5m ago',
    },
    {
      id: 3,
      category: 'Startup',
      categoryColor: 'orange',
      title: 'Building in Public',
      description: 'Weekly standup for indie hackers. Share your MRR goals and wins.',
      liveCount: 0,
      members: 3,
      extraMembers: 12,
      updatedAt: '1h ago',
    },
  ]

  const getCategoryColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'text-purple-400',
      blue: 'text-blue-400',
      orange: 'text-orange-400',
    }
    return colors[color] || 'text-neutral-400'
  }

  return (
    <section className="border-t border-white/5 bg-neutral-900/20 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Trending Rooms
          </h2>
          <Link 
            href="/dashboard"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Link 
              key={room.id}
              href="/dashboard"
              className="group relative rounded-xl bg-neutral-900 border border-white/5 hover:border-neutral-700 transition-all hover:-translate-y-1 duration-300 overflow-hidden cursor-pointer"
            >
              {/* Room Header Image */}
              <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 relative">
                {/* Pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10" 
                  style={{ 
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
                    backgroundSize: '16px 16px' 
                  }}
                ></div>
                
                {/* Live indicator */}
                {room.liveCount > 0 && (
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] text-white font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {room.liveCount} Live
                  </div>
                )}
              </div>

              {/* Room Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${getCategoryColorClass(room.categoryColor)}`}>
                    {room.category}
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-[10px] text-neutral-500">
                    Updated {room.updatedAt}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {room.title}
                </h3>
                
                <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                  {room.description}
                </p>
                
                {/* Room Footer */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex -space-x-2">
                    {/* Avatar placeholders */}
                    {Array.from({ length: Math.min(room.members, 2) }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-6 h-6 rounded-full border border-neutral-900 ${
                          i === 0 ? 'bg-neutral-700' : 'bg-neutral-600'
                        }`}
                      ></div>
                    ))}
                    {room.extraMembers > 0 && (
                      <div className="w-6 h-6 rounded-full bg-neutral-500 border border-neutral-900 flex items-center justify-center text-[8px] text-white font-bold">
                        +{room.extraMembers}
                      </div>
                    )}
                  </div>
                  <button 
                    className="text-neutral-400 hover:text-white transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <MessageSquare size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

