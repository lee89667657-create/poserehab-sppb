// @ts-nocheck
'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Landmark } from '@/types/posture'
import { POSE_LANDMARKS } from '@/hooks/use-pose-detection'

interface PoseOverlayProps {
  landmarks?: Landmark[]
  landmarksRef?: React.RefObject<Landmark[]>
  width: number
  height: number
  showConnections?: boolean
  showPoints?: boolean
  pointColor?: string
  connectionColor?: string
  className?: string
}

// Define connections between landmarks
const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.NOSE],

  // Upper body
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Lower body
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
]

const MAJOR_LANDMARKS: number[] = [
  POSE_LANDMARKS.NOSE,
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.RIGHT_SHOULDER,
  POSE_LANDMARKS.LEFT_HIP,
  POSE_LANDMARKS.RIGHT_HIP,
  POSE_LANDMARKS.LEFT_KNEE,
  POSE_LANDMARKS.RIGHT_KNEE,
  POSE_LANDMARKS.LEFT_ANKLE,
  POSE_LANDMARKS.RIGHT_ANKLE,
]

export function PoseOverlay({
  landmarks,
  landmarksRef,
  width,
  height,
  showConnections = true,
  showPoints = true,
  pointColor = '#6366F1',
  connectionColor = '#10B981',
  className,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastDrawnRef = useRef<Landmark[] | null>(null)

  // Canvas draw function (no React dependencies in hot path)
  const drawPose = useCallback((currentLandmarks: Landmark[]) => {
    const canvas = canvasRef.current
    if (!canvas || currentLandmarks.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // Draw connections
    if (showConnections) {
      ctx.strokeStyle = connectionColor
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      for (let i = 0; i < POSE_CONNECTIONS.length; i++) {
        const [start, end] = POSE_CONNECTIONS[i]
        const startLm = currentLandmarks[start]
        const endLm = currentLandmarks[end]

        if (
          startLm &&
          endLm &&
          (startLm.visibility ?? 1) > 0.5 &&
          (endLm.visibility ?? 1) > 0.5
        ) {
          ctx.beginPath()
          ctx.moveTo(startLm.x * width, startLm.y * height)
          ctx.lineTo(endLm.x * width, endLm.y * height)
          ctx.stroke()
        }
      }
    }

    // Draw points
    if (showPoints) {
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1

      for (let index = 0; index < currentLandmarks.length; index++) {
        const landmark = currentLandmarks[index]
        if ((landmark.visibility ?? 1) > 0.5) {
          const x = landmark.x * width
          const y = landmark.y * height
          const radius = MAJOR_LANDMARKS.includes(index) ? 6 : 4

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fillStyle = pointColor
          ctx.fill()
          ctx.stroke()
        }
      }
    }
  }, [width, height, showConnections, showPoints, pointColor, connectionColor])

  // Mode 1: rAF loop (when landmarksRef is provided) - decoupled from React renders
  useEffect(() => {
    if (!landmarksRef) return

    const animate = () => {
      const current = landmarksRef.current
      // Only redraw if landmarks reference changed (new detection result)
      if (current !== lastDrawnRef.current) {
        drawPose(current)
        lastDrawnRef.current = current
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [landmarksRef, drawPose])

  // Mode 2: Prop-based (fallback when landmarksRef not provided)
  useEffect(() => {
    if (landmarksRef || !landmarks) return
    drawPose(landmarks)
  }, [landmarks, landmarksRef, drawPose])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ transform: 'scaleX(-1)' }}
    />
  )
}
