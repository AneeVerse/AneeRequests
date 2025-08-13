"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Send, Image as ImageIcon, Link as LinkIcon, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface RichTextEditorProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
  sending?: boolean
}

export default function RichTextEditor({ onSend, placeholder = "Type your message...", disabled = false, sending = false }: RichTextEditorProps) {
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isClient, setIsClient] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  const addImage = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        editor?.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSend = () => {
    if (editor && !editor.isEmpty) {
      const content = editor.getHTML()
      onSend(content)
      editor.commands.clearContent()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isClient || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <div className="p-1.5 rounded opacity-50">
            <Bold size={16} />
          </div>
          <div className="p-1.5 rounded opacity-50">
            <Italic size={16} />
          </div>
          <div className="p-1.5 rounded opacity-50">
            <Underline size={16} />
          </div>
        </div>
        <div className="p-3">
          <div className="min-h-[80px] bg-gray-50 rounded"></div>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
          <div></div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-lg cursor-not-allowed"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('underline') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Underline size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ListOrdered size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => setShowLinkInput(true)}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('link') ? 'bg-gray-200' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={() => setShowImageInput(true)}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ImageIcon size={16} />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-3">
        <EditorContent 
          editor={editor} 
          onKeyPress={handleKeyPress}
          className="min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={handleSend}
          disabled={editor.isEmpty || sending || disabled}
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
