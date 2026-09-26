(function () {
  const currentScript = document.currentScript;
  const clientId = currentScript ? currentScript.getAttribute('data-client-id') : null;
  
  if (!clientId) {
    console.error('Shield AI Chatbot: data-client-id is missing.');
    return;
  }

  const hostUrl = new URL(currentScript.src).origin;

  const style = document.createElement('style');
  style.innerHTML = `
    #shield-chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #shield-chatbot-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #000;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
      transition: transform 0.2s;
    }
    #shield-chatbot-button:hover {
      transform: scale(1.05);
    }
    #shield-chatbot-button svg {
      width: 28px;
      height: 28px;
    }
    #shield-chatbot-window {
      display: none;
      width: 350px;
      height: 500px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      position: absolute;
      bottom: 80px;
      right: 0;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #eaeaea;
    }
    @media (max-width: 400px) {
      #shield-chatbot-window {
        width: 100vw;
        height: 100vh;
        bottom: 0;
        right: -20px;
        border-radius: 0;
      }
    }
    #shield-chatbot-header {
      background: #000;
      color: #fff;
      padding: 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #shield-chatbot-close {
      cursor: pointer;
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      line-height: 1;
    }
    #shield-chatbot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f9f9f9;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .shield-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .shield-msg-user {
      background: #000;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .shield-msg-ai {
      background: #fff;
      color: #000;
      align-self: flex-start;
      border: 1px solid #eaeaea;
      border-bottom-left-radius: 4px;
    }
    #shield-chatbot-input-container {
      padding: 12px;
      background: #fff;
      border-top: 1px solid #eaeaea;
      display: flex;
      gap: 8px;
    }
    #shield-chatbot-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
    }
    #shield-chatbot-input:focus {
      border-color: #000;
    }
    #shield-chatbot-send {
      background: #000;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #shield-chatbot-send:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .shield-typing {
      display: flex;
      gap: 4px;
      padding: 12px 14px;
      background: #fff;
      border: 1px solid #eaeaea;
      align-self: flex-start;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
    }
    .shield-dot {
      width: 6px;
      height: 6px;
      background: #888;
      border-radius: 50%;
      animation: shield-bounce 1.4s infinite ease-in-out both;
    }
    .shield-dot:nth-child(1) { animation-delay: -0.32s; }
    .shield-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes shield-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  // Fetch configuration
  let config = {
    branding: {
      primaryColor: '#000000',
      chatbotTitle: 'Support Assistant',
      chatbotWelcomeMessage: 'Hello! How can I help you today?'
    }
  };

  fetch(`${hostUrl}/api/widget-config?clientId=${clientId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.error && data.chatbotEnabled !== false) {
        config = { ...config, ...data };
        updateBranding();
      } else if (data.chatbotEnabled === false) {
        document.getElementById('shield-chatbot-container').style.display = 'none';
      }
    })
    .catch(() => { /* use defaults */ });

  const container = document.createElement('div');
  container.id = 'shield-chatbot-container';
  container.innerHTML = `
    <div id="shield-chatbot-window">
      <div id="shield-chatbot-header" style="background: ${config.branding.primaryColor}">
        <span id="shield-chatbot-title">${config.branding.chatbotTitle}</span>
        <button id="shield-chatbot-close">&times;</button>
      </div>
      <div id="shield-chatbot-messages">
        <div class="shield-msg shield-msg-ai">${config.branding.chatbotWelcomeMessage}</div>
      </div>
      <div id="shield-chatbot-input-container">
        <input type="text" id="shield-chatbot-input" placeholder="Type a message..." autocomplete="off" />
        <button id="shield-chatbot-send" style="background: ${config.branding.primaryColor}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </div>
    <button id="shield-chatbot-button" style="background: ${config.branding.primaryColor}">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
    </button>
  `;
  document.body.appendChild(container);

  function updateBranding() {
    const header = document.getElementById('shield-chatbot-header');
    const send = document.getElementById('shield-chatbot-send');
    const button = document.getElementById('shield-chatbot-button');
    const title = document.getElementById('shield-chatbot-title');
    const welcome = document.querySelector('.shield-msg-ai');
    
    if (header) header.style.background = config.branding.primaryColor;
    if (send) send.style.background = config.branding.primaryColor;
    if (button) button.style.background = config.branding.primaryColor;
    if (title) title.innerText = config.branding.chatbotTitle;
    if (welcome && chatHistory.length === 0) welcome.innerText = config.branding.chatbotWelcomeMessage;
    
    // Create new style block for dynamic user message backgrounds
    const dynamicStyle = document.createElement('style');
    dynamicStyle.innerHTML = ".shield-msg-user { background: " + config.branding.primaryColor + " !important; }";
    document.head.appendChild(dynamicStyle);
  }

  const btn = document.getElementById('shield-chatbot-button');
  const win = document.getElementById('shield-chatbot-window');
  const closeBtn = document.getElementById('shield-chatbot-close');
  const messagesDiv = document.getElementById('shield-chatbot-messages');
  const inputEl = document.getElementById('shield-chatbot-input');
  const sendBtn = document.getElementById('shield-chatbot-send');

  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) inputEl.focus();
  });
  closeBtn.addEventListener('click', () => {
    isOpen = false;
    win.style.display = 'none';
  });

  let chatHistory = [];

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    inputEl.value = '';
    sendBtn.disabled = true;

    const currentHistory = [...chatHistory];
    
    // Add to local history after copying for this request
    chatHistory.push({ role: 'user', content: text });
    if (chatHistory.length > 10) chatHistory.shift();

    const typingId = 'typing-' + Date.now();
    const typingHtml = `<div id="${typingId}" class="shield-typing"><div class="shield-dot"></div><div class="shield-dot"></div><div class="shield-dot"></div></div>`;
    messagesDiv.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();

    try {
      const res = await fetch(`${hostUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, message: text, history: currentHistory })
      });
      const data = await res.json();
      
      document.getElementById(typingId).remove();
      
      if (res.ok) {
        addMessage(data.response, 'ai');
        chatHistory.push({ role: 'model', content: data.response });
        if (chatHistory.length > 10) chatHistory.shift();
      } else {
        addMessage(data.error || 'Sorry, an error occurred.', 'ai');
        chatHistory.pop(); // Remove the user message from history if it failed
      }
    } catch (err) {
      if (document.getElementById(typingId)) {
        document.getElementById(typingId).remove();
      }
      addMessage('Network error. Please try again.', 'ai');
      chatHistory.pop(); // Remove the user message from history if it failed
    }

    sendBtn.disabled = false;
    inputEl.focus();
  }

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `shield-msg shield-msg-${sender}`;
    div.innerText = text;
    messagesDiv.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();