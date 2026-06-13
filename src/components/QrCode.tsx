import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => setSrc(null))
    return () => {
      cancelled = true
    }
  }, [value, size])
  if (!src) return <div style={{ width: size, height: size }} className="rounded bg-zinc-200 dark:bg-zinc-800" />
  return <img src={src} width={size} height={size} alt="QR code for this party" className="rounded bg-white p-1" />
}
