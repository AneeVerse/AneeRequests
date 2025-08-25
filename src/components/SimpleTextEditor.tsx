"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Send, Link as LinkIcon, Bold, Italic, Underline, List } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SimpleTextEditorProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
  sending?: boolean
  variant?: 'chat' | 'form'
}

export default function SimpleTextEditor({ 
  onSend, 
  placeholder = "Type your message...", 
  disabled = false, 
  sending = false,
  variant = 'chat'
}: SimpleTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
             Link.configure({
         openOnClick: true,
         autolink: false,
         linkOnPaste: false,
         validate: (href) => /^https?:\/\//.test(href),
         HTMLAttributes: {
           class: 'text-blue-600 underline hover:text-blue-800',
           target: '_blank',
           rel: 'noopener noreferrer',
         },
       }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
         editorProps: {
       attributes: {
         class: 'prose prose-sm focus:outline-none min-h-[80px] max-h-[200px] overflow-y-auto text-gray-900',
       },
     },
    immediatelyRender: false,
  })

  const addLink = () => {
    if (editor && linkUrl.trim()) {
      const { from, to } = editor.state.selection
      
      if (editor.view.state.selection.empty) {
        // No text selected, insert link at cursor
        editor.chain().focus().insertContent(`<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer">${linkUrl.trim()}</a>`).run()
        // Move cursor after the inserted link
        setTimeout(() => {
          if (editor) {
            editor.commands.setTextSelection(from + linkUrl.trim().length + 1)
          }
        }, 10)
      } else {
        // Text is selected, wrap it with link
        editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
        // Move cursor to end of selection to prevent link expansion
        setTimeout(() => {
          if (editor) {
            editor.commands.setTextSelection(to)
          }
        }, 10)
      }
      
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run()
    }
  }

  const toggleLink = () => {
    if (editor) {
      if (editor.isActive('link')) {
        // If link is active, remove it
        removeLink()
      } else {
        // If no link is active, show link input
        setShowLinkInput(true)
      }
    }
  }

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowLinkInput(false)
      setLinkUrl('')
    }
  }

  const handleSend = () => {
    if (editor) {
      const content = editor.getHTML()
      // Check if content has actual text (not just empty paragraphs)
      const hasContent = content && content.replace(/<[^>]*>/g, '').trim().length > 0
      
      if (hasContent) {
        onSend(content)
        if (variant === 'chat') {
          editor.commands.clearContent()
        }
      }
    }
  }

  // For form variant, update content as user types
  useEffect(() => {
    if (editor && variant === 'form') {
      const updateContent = () => {
        const content = editor.getHTML()
        if (content !== '<p></p>') { // Avoid sending empty content
          onSend(content)
        }
      }
      
      editor.on('update', updateContent)
      return () => {
        editor.off('update', updateContent)
      }
    }
  }, [editor, variant, onSend])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (variant === 'chat' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Break out of link when pressing Space or any punctuation
    if (editor && editor.isActive('link')) {
      const breakChars = [' ', ',', '.', '!', '?', ';', ':', '-', '_']
      if (breakChars.includes(e.key)) {
        // Move cursor after the link
        const { to } = editor.state.selection
        setTimeout(() => {
          if (editor) {
            editor.commands.setTextSelection(to)
          }
        }, 10)
      }
    }
  }

  // Helper function to check if editor has content
  const hasContent = () => {
    if (!editor) return false
    const content = editor.getHTML()
    return content && content.replace(/<[^>]*>/g, '').trim().length > 0
  }

  // Add real-time content checking
  useEffect(() => {
    if (editor && variant === 'chat') {
      const updateButtonState = () => {
        // Force re-render to update button state
        setForceUpdate(prev => !prev)
      }
      
      editor.on('update', updateButtonState)
      return () => {
        editor.off('update', updateButtonState)
      }
    }
  }, [editor, variant])

  // Add state to force re-renders for button updates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [forceUpdate, setForceUpdate] = useState(false)

  if (!isClient || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg bg-white">
                 <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
           <div className="p-1.5 rounded text-gray-400">
             <Bold size={16} />
           </div>
           <div className="p-1.5 rounded text-gray-400">
             <Italic size={16} />
           </div>
           <div className="p-1.5 rounded text-gray-400">
             <Underline size={16} />
           </div>
           <div className="p-1.5 rounded text-gray-400">
             <List size={16} />
           </div>
           <div className="p-1.5 rounded text-gray-400">
             <LinkIcon size={16} />
           </div>
         </div>
        <div className="p-3">
          <div className="min-h-[80px] bg-gray-50 rounded"></div>
        </div>
        {variant === 'chat' && (
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
        )}
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
             editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
           } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           <Bold size={16} />
         </button>
         <button
           onClick={() => editor.chain().focus().toggleItalic().run()}
           disabled={!editor.can().chain().focus().toggleItalic().run()}
           className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
             editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
           } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           <Italic size={16} />
         </button>
         <button
           onClick={() => editor.chain().focus().toggleUnderline().run()}
           className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
             editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
           } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           <Underline size={16} />
         </button>
         
         <button
           onClick={() => editor.chain().focus().toggleBulletList().run()}
           className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
             editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
           } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           <List size={16} />
         </button>
         
         <div className="w-px h-6 bg-gray-300 mx-1" />
         
                   <button
            onClick={toggleLink}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('link') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={editor.isActive('link') ? 'Remove link' : 'Add link'}
          >
            <LinkIcon size={16} />
          </button>
      </div>

             {/* Editor Content */}
       <div className="p-3">
         <EditorContent 
           editor={editor} 
           onKeyPress={handleKeyPress}
           onKeyDown={handleKeyDown}
           className="min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none [&_.ProseMirror]:text-gray-900 [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:text-gray-900 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0"
         />
       </div>

              {/* Bottom Actions */}
        {variant === 'chat' && (
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
              disabled={!hasContent() || sending || disabled}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}

             {/* Link URL Modal */}
       {showLinkInput && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Link</h3>
                           <input
                type="url"
                placeholder="Enter URL (e.g., https://example.com)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
                onKeyDown={handleLinkKeyDown}
                autoFocus
              />
             <div className="flex gap-2">
               <button
                 onClick={addLink}
                 className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium"
               >
                 Add Link
               </button>
               <button
                 onClick={() => setShowLinkInput(false)}
                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
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
