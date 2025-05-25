"use client"

import { useState, useRef, ReactNode, MouseEvent } from 'react'

interface DraggableWindowProps {
  children: ReactNode
  initialPosition?: { x: number, y: number }
  className?: string
  handleClassName?: string
  onClose?: () => void
  onMinimize?: () => void
  title?: string
  width?: number
  height?: number
  allowMaximize?: boolean
  isTaskManager?: boolean
}

export function DraggableWindow({
  children,
  initialPosition = { x: 100, y: 100 },
  className = "",
  handleClassName = "",
  onClose,
  onMinimize,
  title = "Window",
  width = 600,
  height = 400,
  allowMaximize = false,
  isTaskManager = false
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [previousPosition, setPreviousPosition] = useState(initialPosition)
  const [previousSize, setPreviousSize] = useState({ width, height })
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: MouseEvent) => {
    if (windowRef.current && !isMaximized) {
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore previous size and position
      setIsMaximized(false)
      setPosition(previousPosition)
    } else {
      // Save current size and position
      setPreviousPosition(position)
      setPreviousSize({ width, height })
      // Maximize
      setIsMaximized(true)
    }
  }

  // Calculate styles based on maximized state
  const windowStyle = isMaximized 
    ? {
        left: '0',
        top: '0',
        width: '100%',
        height: 'calc(100vh - 40px)', // Leave space for taskbar
        zIndex: 999,
      } 
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: isDragging ? 1000 : 100,
      };

  return (
    <div
      ref={windowRef}
      className={`absolute shadow-lg bg-white rounded-md overflow-hidden ${className}`}
      style={windowStyle}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`bg-blue-700 text-white px-2 py-1 flex justify-between items-center cursor-move ${handleClassName}`}
        onMouseDown={handleMouseDown}
      >
        <div className="font-semibold">{title}</div>
        <div className="flex items-center">
          {onMinimize && (
            <button 
              onClick={onMinimize}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-sm w-5 h-5 flex items-center justify-center mr-1"
              title="Minimize"
            >
              _
            </button>
          )}
          {(allowMaximize || isTaskManager) && (
            <button 
              onClick={handleMaximize}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-sm w-5 h-5 flex items-center justify-center mr-1"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? '□' : '▢'}
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white rounded-sm w-5 h-5 flex items-center justify-center"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="overflow-auto" style={{ height: 'calc(100% - 28px)' }}>
        {children}
      </div>
    </div>
  )
}
