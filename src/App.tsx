import { useState } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useChatMessages } from './hooks/useChatMessages'
import { sendMessage } from './services/firebase/firestore'
import { uploadChatMessageMedia } from './services/firebase/storage'

function App() {
  const { user, signInWithGoogle, signOut } = useAuth()
  const [roomId, setRoomId] = useState('general')
  const { messages, loading, loadMore } = useChatMessages(roomId)
  const [inputText, setInputText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user) return

    try {
      await sendMessage(roomId, inputText, user.uid, user.displayName || 'Anonymous')
      setInputText('')
    } catch (error) {
      console.error("Failed to send message", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const url = await uploadChatMessageMedia(roomId, file)
      await sendMessage(roomId, `Sent a file: ${file.name}`, user.uid, user.displayName || 'Anonymous', url)
    } catch (error) {
      console.error("Failed to upload file", error)
    } finally {
      setIsUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="login-container">
        <h1>Welcome to ChatApp</h1>
        <div className="login-buttons">
          <button onClick={signInWithGoogle}>Sign in with Google</button>
          {/* Email/Password UI could be added here */}
          <p>Email/Password methods also available via AuthProvider.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <h3>Rooms</h3>
        <ul>
          <li className={roomId === 'general' ? 'active' : ''} onClick={() => setRoomId('general')}># general</li>
          <li className={roomId === 'random' ? 'active' : ''} onClick={() => setRoomId('random')}># random</li>
        </ul>
      </aside>

      <section className="chat-main">
        <header>
          <h2>Room: {roomId}</h2>
          <div className="user-info">
            <span>{user.displayName}</span>
            <button onClick={signOut}>Sign Out</button>
          </div>
        </header>

        <main className="messages-list">
          <button className="load-more" onClick={loadMore}>Load older messages</button>
          {loading ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.senderId === user.uid ? 'own' : ''}`}>
                <div className="msg-header">
                  <strong>{msg.senderName}</strong>
                </div>
                <div className="msg-body">
                  {msg.text}
                  {msg.imageUrl && (
                    <div className="msg-media">
                      <img src={msg.imageUrl} alt="Attached media" style={{ maxWidth: '200px' }} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </main>

        <footer>
          <form onSubmit={handleSend} className="message-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
            />
            <label className="file-upload">
              <span>📎</span>
              <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
            </label>
            <button type="submit" disabled={!inputText.trim()}>Send</button>
          </form>
          {isUploading && <p className="upload-status">Uploading media...</p>}
        </footer>
      </section>
    </div>
  )
}

export default App
