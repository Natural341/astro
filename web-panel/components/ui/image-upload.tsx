"use client"

import { useCallback, useState, useRef } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadAstrologerPhoto } from "@/lib/api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.1.23:8080"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resolveUrl = (url: string) => {
    if (!url) return ""
    if (url.startsWith("http")) return url
    return `${BASE_URL}${url}`
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("Only JPG, PNG, or WebP images are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }
    setUploading(true)
    try {
      const res = await uploadAstrologerPhoto(file)
      onChange(res.url)
    } catch (err: any) {
      alert(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }, [handleFile])

  return (
    <div className={cn("relative", className)}>
      {value ? (
        <div className="relative group">
          <img
            src={resolveUrl(value)}
            alt="Upload preview"
            className="w-full h-40 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <Upload className="h-4 w-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 bg-white/20 rounded-full hover:bg-red-500/60 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            dragOver ? "border-violet-500 bg-violet-500/5" : "border-border hover:border-muted-foreground/50",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP (max 5MB)</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
