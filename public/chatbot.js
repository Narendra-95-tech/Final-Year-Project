document.addEventListener("DOMContentLoaded", () => {
  // Create the floating chat bubble
  const chatBubble = document.createElement("div");
  chatBubble.id = "floating-chat";
  chatBubble.innerHTML = `
    <div class="chat-header">Chat</div>
    <div class="chat-body" style="display:none;">
      <div class="messages"></div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" placeholder="Type a message..." />
        <button class="send-btn">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(chatBubble);

  // Add basic styles
  const style = document.createElement("style");
  style.innerHTML = `
    #floating-chat {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      border-radius: 10px;
      background: #fff;
      font-family: Arial, sans-serif;
      z-index: 9999;
    }
    #floating-chat .chat-header {
      background: #007bff;
      color: white;
      padding: 10px;
      border-radius: 10px 10px 0 0;
      cursor: pointer;
      font-weight: bold;
    }
    #floating-chat .chat-body {
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
    }
    #floating-chat .messages .message {
      margin: 5px 0;
      padding: 6px 10px;
      border-radius: 10px;
    }
    #floating-chat .messages .user { background: #e0f7fa; text-align: right; }
    #floating-chat .messages .bot { background: #f1f1f1; text-align: left; }
    #floating-chat .chat-input-area { display: flex; gap: 5px; margin-top: 5px; }
    #floating-chat .chat-input { flex: 1; padding: 5px; border-radius: 5px; border: 1px solid #ccc; }
    #floating-chat .send-btn { padding: 5px 10px; border: none; background: #007bff; color: white; border-radius: 5px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // References
  const header = chatBubble.querySelector(".chat-header");
  const body = chatBubble.querySelector(".chat-body");
  const sendBtn = chatBubble.querySelector(".send-btn");
  const input = chatBubble.querySelector(".chat-input");
  const messages = chatBubble.querySelector(".messages");

  // Toggle chat open/close
  header.addEventListener("click", () => {
    body.style.display = body.style.display === "block" ? "none" : "block";
  });

  // Send message
  sendBtn.addEventListener("click", async () => {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    try {
      const response = await fetch("/chat/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await response.json();
      addMessage("bot", data.reply);
    } catch (err) {
      console.error(err);
      addMessage("bot", "Sorry, something went wrong.");
    }
  });

  // Add message to chat window
  function addMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    msgDiv.textContent = text;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }
});
