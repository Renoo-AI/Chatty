import { useState, useRef, useEffect } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useChatMessages } from './hooks/useChatMessages'
import { sendMessage } from './services/firebase/firestore'
import { uploadChatMessageMedia } from './services/firebase/storage'

function App() {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymous,
    signOut
  } = useAuth()
  const [roomId, setRoomId] = useState('general')
  const { messages, loading, loadMore, loadingMore, hasMore } = useChatMessages(roomId)
  const [inputText, setInputText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessagesLength = useRef(0)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const isInitialLoad = prevMessagesLength.current === 0 && messages.length > 0
    const hasNewMessage = messages.length > prevMessagesLength.current

    // Detect if we added messages to the top (load more) or bottom (new message)
    // displayMessages is chronological [oldest, ..., newest]
    // So if the last message ID changed, it's a new message at the bottom
    const lastMessageChanged = messages.length > 0 &&
      (prevMessagesLength.current === 0 || messages[messages.length - 1].id !== messages[prevMessagesLength.current - 1]?.id)

    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150

    if (isInitialLoad) {
      scrollToBottom('auto')
    } else if (hasNewMessage && lastMessageChanged && isAtBottom) {
      scrollToBottom('smooth')
    }

    prevMessagesLength.current = messages.length
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user) return

    try {
      await sendMessage(
        roomId,
        inputText,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL
      )
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
      await sendMessage(
        roomId,
        `Sent a file: ${file.name}`,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL,
        url
      )
    } catch (error) {
      console.error("Failed to upload file", error)
    } finally {
      setIsUploading(false)
    }
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName, avatarUrl)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed')
    }
  }

  const handleAnonymousSignIn = async () => {
    setError('')
    try {
      await signInAnonymous()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest Sign-In failed')
    }
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>ChatApp</h1>
          <p>Connect instantly with your team</p>

          <form onSubmit={handleEmailAuth} className="email-login-form">
            {isSignUp && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
                <input
                  type="url"
                  placeholder="Avatar URL (Optional)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            {error && <p className="error-msg">{error}</p>}
          </form>

          <div className="divider"><span>OR</span></div>

          <div className="social-login">
            <button onClick={handleGoogleSignIn} className="google-btn">
              Sign in with Google
            </button>
            <button onClick={handleAnonymousSignIn} className="guest-btn">
              Continue as Guest
            </button>
          </div>

          <p className="toggle-auth">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
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

        <main className="messages-list" ref={scrollRef}>
          {hasMore && (
            <button className="load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          )}
          {loading && messages.length === 0 ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.senderId === user.uid ? 'own' : ''}`}>
                <div className="msg-header">
                  {msg.senderAvatar && (
                    <img src={msg.senderAvatar} alt="" className="avatar" />
                  )}
                  <strong>{msg.senderName || 'Anonymous'}</strong>
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
          <div ref={messagesEndRef} />
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
