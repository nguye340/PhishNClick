"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      if (!visible) setVisible(true)
    }

    const handleMouseLeave = () => setVisible(false)
    const handleMouseEnter = () => setVisible(true)

    window.addEventListener('mousemove', updatePosition)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    // Hide default cursor
    document.documentElement.style.cursor = 'none'
    document.body.style.cursor = 'none'
    const allElements = document.querySelectorAll('*')
    allElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.cursor = 'none'
      }
    })

    return () => {
      window.removeEventListener('mousemove', updatePosition)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      
      // Restore default cursor
      document.documentElement.style.cursor = ''
      document.body.style.cursor = ''
    }
  }, [visible])

  return (
    <div 
      className="fixed pointer-events-none z-[9999]" 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(0px, 0px)', // Remove centering to align with actual cursor
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.1s ease',
      }}
    >
      <Image 
        src="/img/cursor-custom.png" 
        alt="Custom Cursor" 
        width={48} 
        height={48} 
        priority
        style={{ 
          transform: 'translate(-18px, -10px)', // Fine-tune the alignment of the cursor tip
        }}
      />
    </div>
  )
}
