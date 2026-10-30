"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface RecordingControls {
  recording: boolean
  requesting: boolean
  seconds: number
  error: string
  start: () => Promise<void>
  stop: (cancel?: boolean) => void
}

export function useRecording(
  onFinish: (file: File) => void,
  maxSeconds: number
): RecordingControls {
  const [recording, setRecording] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState("")
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const generation = useRef(0)
  const finish = useRef(onFinish)
  useEffect(() => {
    finish.current = onFinish
  }, [onFinish])

  const release = useCallback((): void => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
  }, [])

  const stop = useCallback(
    (cancel = false): void => {
      if (cancel) generation.current++
      if (recorder.current?.state === "recording") recorder.current.stop()
      release()
      setRecording(false)
      setRequesting(false)
    },
    [release]
  )

  useEffect(
    () => () => {
      generation.current++
      if (recorder.current?.state === "recording") recorder.current.stop()
      release()
    },
    [release]
  )

  async function start(): Promise<void> {
    if (requesting || recording) return
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Audio recording is unavailable in this browser. Attach an audio file instead."
      )
      return
    }
    const run = ++generation.current
    setError("")
    setRequesting(true)
    try {
      const captured = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      if (run !== generation.current) {
        captured.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = captured
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type))
      const media = new MediaRecorder(
        captured,
        mimeType ? { mimeType } : undefined
      )
      recorder.current = media
      const chunks: Blob[] = []
      media.ondataavailable = (event): void => {
        if (event.data.size) chunks.push(event.data)
      }
      media.onstop = (): void => {
        if (run !== generation.current) return
        const type = media.mimeType || chunks[0]?.type || "audio/webm"
        const blob = new Blob(chunks, { type })
        if (blob.size)
          finish.current(
            new File(
              [blob],
              `Voice note.${type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"}`,
              { type }
            )
          )
      }
      media.onerror = (): void => {
        if (run !== generation.current) return
        setError("Recording failed. Please try again.")
        stop(true)
      }
      media.start(1000)
      setSeconds(0)
      setRecording(true)
      setRequesting(false)
      const began = Date.now()
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - began) / 1000)
        setSeconds(elapsed)
        if (elapsed >= maxSeconds) stop()
      }, 250)
    } catch (cause) {
      if (run !== generation.current) return
      release()
      setRequesting(false)
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings to record."
          : "Could not access a microphone. Check your device and try again."
      )
    }
  }

  return { recording, requesting, seconds, error, start, stop }
}
