'use client'

import React, { useRef, useEffect, useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface ScrollStackItem {
  icon: LucideIcon
  title: string
  value: string | number
  description: string
  color: string
  bgGradient: string
}

interface ScrollStackProps {
  items: ScrollStackItem[]
  className?: string
}

export default function ScrollStack({ items, className = '' }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleIndex, setVisibleIndex] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const scrollTop = window.scrollY
      const containerTop = container.offsetTop
      const windowHeight = window.innerHeight
      const containerHeight = container.offsetHeight

      // Calculate which item should be visible based on scroll position
      const scrollProgress = (scrollTop - containerTop + windowHeight / 2) / containerHeight
      const itemIndex = Math.floor(scrollProgress * items.length)

      setVisibleIndex(Math.max(0, Math.min(items.length - 1, itemIndex)))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items.length])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Sticky container for stacking effect */}
      <div className="sticky top-24">
        <div className="space-y-4">
          {items.map((item, index) => {
            const Icon = item.icon
            const isVisible = index <= visibleIndex
            const scale = isVisible ? 1 : 0.95
            const opacity = isVisible ? 1 : 0
            const translateY = isVisible ? 0 : 20
            const zIndex = items.length - index

            return (
              <div
                key={index}
                className="transition-all duration-500 ease-out"
                style={{
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  opacity,
                  zIndex,
                }}
              >
                <div
                  className={`${item.bgGradient} rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-white/20`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-white/80 text-sm font-medium mb-1">
                        {item.title}
                      </h3>
                      <div className="text-3xl font-bold text-white mb-1">
                        {item.value}
                      </div>
                      <p className="text-white/70 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spacer to enable scrolling */}
      <div style={{ height: `${items.length * 200}px` }} />
    </div>
  )
}
