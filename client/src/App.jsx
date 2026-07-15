import { useState, useRef } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [fileStatus, setFileStatus] = useState('idle'); // idle, uploading, success, error
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [chunks, setChunks] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Helper to scroll to bottom of chat
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Helper to format file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Trigger file selection
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // File selected handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        uploadFile(droppedFile);
      } else {
        setFileStatus('error');
        setErrorMessage('Please select a valid PDF file.');
      }
    }
  };

  // Upload file API call
  const uploadFile = async (selectedFile) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(formatBytes(selectedFile.size));
    setFileStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('https://chatpdf-1-6sgj.onrender.com/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFileStatus('success');
        // Add system message that PDF is ready
        setMessages([
          {
            role: 'bot',
            text: `Hi! I have successfully processed the PDF: "${selectedFile.name}". You can ask me any question about it now!`
          }
        ]);
      } else {
        setFileStatus('error');
        setErrorMessage(data.message || 'Failed to upload PDF.');
      }
    } catch (error) {
      console.error(error);
      setFileStatus('error');
      setErrorMessage('Server connection error. Is the backend running?');
    }
  };

  // Send message API call
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userQuestion = input.trim();
    setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', text: userQuestion }];
    setMessages(updatedMessages);
    scrollToBottom();

    setChatLoading(true);

    try {
      const response = await fetch('https://chatpdf-1-6sgj.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prev) => [...prev, { role: 'bot', text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: data.message || 'Error occurred while fetching answer.' }
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Failed to connect to chat server. Please make sure the server is running.' }
      ]);
    } finally {
      setChatLoading(false);
      scrollToBottom();
    }
  };

  // Simple markdown parser to render bold text and bullet points like real GPTs
  const renderMessageText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      
      let content = line;
      if (isBullet) {
        content = trimmed.substring(2);
      }
      
      // Parse bold text (**text**)
      const parts = content.split('**');
      const parsedLine = parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index}>{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={i} style={{ marginLeft: '16px', marginBottom: '6px', listStyleType: 'disc' }}>
            {parsedLine}
          </li>
        );
      }
      
      return (
        <p key={i} style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar for Upload */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">PDF</div>
          <div className="logo-text">
            <h1>ChatPDF AI</h1>
            <p>RAG Chatbot</p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div 
          className={`upload-card ${dragActive ? 'drag-active' : ''}`}
          onClick={handleUploadClick}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input" 
            accept=".pdf"
            onChange={handleFileChange}
          />
          <div className="upload-icon">📄</div>
          <h3>Upload PDF Document</h3>
          <p>Drag & drop your PDF file here, or click to browse</p>
        </div>

        {/* Upload Status Card */}
        {fileStatus !== 'idle' && (
          <div className="file-info-box">
            <div className="file-details">
              <div className="file-icon">📁</div>
              <div className="file-meta">
                <span className="file-name" title={fileName}>{fileName}</span>
                <span className="file-size">{fileSize}</span>
              </div>
            </div>

            {fileStatus === 'uploading' && (
              <span className="status-badge loading">⌛ Processing...</span>
            )}
            {fileStatus === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="status-badge success">✓ Ready to Chat</span>
              </div>
            )}
            {fileStatus === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="status-badge error">⚠ Failed</span>
                <span style={{ fontSize: '11px', color: 'var(--error)' }}>
                  {errorMessage}
                </span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Chat View */}
      <main className="chat-area">
        <header className="chat-header">
          <div className="chat-header-title">
            {fileStatus === 'success' ? `Chatting with: ${fileName}` : 'No PDF Loaded'}
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Start RAG Chat</h3>
              <p>Upload a PDF document on the left panel to begin chatting with its contents using Pinecone and Gemini.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="message-row bot">
              <div className="message-bubble">
                <div className="typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="input-panel">
          <form onSubmit={handleSendMessage} className="input-container">
            <input 
              type="text" 
              className="chat-input"
              placeholder={fileStatus === 'success' ? "Ask something about the document..." : "Please upload a PDF first to chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={fileStatus !== 'success' || chatLoading}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={fileStatus !== 'success' || !input.trim() || chatLoading}
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
