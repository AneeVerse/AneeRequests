"use client"
import { useState, useRef } from 'react'
import { Send, Image as ImageIcon, Link as LinkIcon, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'

interface SimpleTextEditorProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
  sending?: boolean
}

export default function SimpleTextEditor({ onSend, placeholder = "Type your message...", disabled = false, sending = false }: SimpleTextEditorProps) {
  const [message, setMessage] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertText = (text: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const newText = message.substring(0, start) + text + message.substring(end)
    setMessage(newText)
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const formatText = (format: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${message.substring(start, end)}**`
        break
      case 'italic':
        formattedText = `*${message.substring(start, end)}*`
        break
      case 'underline':
        formattedText = `__${message.substring(start, end)}__`
        break
      case 'bullet':
        formattedText = `• ${message.substring(start, end)}`
        break
      case 'numbered':
        formattedText = `1. ${message.substring(start, end)}`
        break
      default:
        formattedText = message.substring(start, end)
    }
    
    const newText = message.substring(0, start) + formattedText + message.substring(end)
    setMessage(newText)
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const addImage = () => {
    if (imageUrl) {
      insertText(`![Image](${imageUrl})`)
      setImageUrl('')
      setShowImageInput(false)
    }
  }

  const addLink = () => {
    if (linkUrl && linkText) {
      insertText(`[${linkText}](${linkUrl})`)
      setLinkUrl('')
      setLinkText('')
      setShowLinkInput(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        insertText(`![${file.name}](${result})`)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => formatText('bold')}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => formatText('bullet')}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => formatText('numbered')}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => setShowLinkInput(true)}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={() => setShowImageInput(true)}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Add Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          title="Upload File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-3 bg-white">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full min-h-[80px] max-h-[200px] border-0 focus:outline-none focus:ring-0 resize-none text-gray-900 text-sm placeholder-gray-400"
          placeholder={placeholder}
          disabled={disabled}
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Image URL Modal */}
      {showImageInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            <input
              type="url"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addImage}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowImageInput(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link URL Modal */}
      {showLinkInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <input
              type="text"
              placeholder="Link text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowLinkInput(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
