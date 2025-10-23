"use client"

import { useState, useRef, ReactNode, MouseEvent } from 'react'

interface Position {
  x: number | string
  y: number | string
}

interface Size {
  width: number | string
  height: number | string
}

interface DraggableWindowProps {
  children: ReactNode
  initialPosition?: Position
  className?: string
  handleClassName?: string
  onClose?: () => void
  onMinimize?: () => void
  title?: string
  width?: number | string
  height?: number | string
  minWidth?: number
  minHeight?: number
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
  minWidth,
  minHeight,
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
        position: 'absolute' as const,
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        zIndex: 10000,
      } 
    : {
        position: 'absolute' as const,
        left: typeof position.x === 'number' ? `${position.x}px` : position.x,
        top: typeof position.y === 'number' ? `${position.y}px` : position.y,
        width: typeof width === 'string' ? width : `${width}px`,
        height: typeof height === 'string' ? height : `${height}px`,
        ...(minWidth !== undefined && { minWidth: `${minWidth}px` }),
        ...(minHeight !== undefined && { minHeight: `${minHeight}px` }),
        zIndex: isDragging ? 10001 : 10000,
      };

  return (
    <div
      ref={windowRef}
      className={`shadow-lg bg-white rounded-md overflow-hidden ${className}`}
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
