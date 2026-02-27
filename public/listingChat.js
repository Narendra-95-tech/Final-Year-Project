document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".listing-card").forEach(card => {
    const chatBtn = document.createElement("button");
    chatBtn.textContent = "Chat about this listing";
    chatBtn.classList.add("listing-chat-btn");
    card.appendChild(chatBtn);

    // Create chat box
    const chatBox = document.createElement("div");
    chatBox.classList.add("listing-chat-box");
    chatBox.innerHTML = `
      <div class="chat-header">AI Assistant <span class="close-chat" style="cursor:pointer;">✖</span></div>
      <div class="chat-body" style="display:none;">
        <div class="messages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" placeholder="Ask about this listing..." />
          <button class="send-btn">Send</button>
        </div>
      </div>
    `;
    card.appendChild(chatBox);

    const header = chatBox.querySelector(".chat-header");
    const body = chatBox.querySelector(".chat-body");
    const closeBtn = chatBox.querySelector(".close-chat");
    const sendBtn = chatBox.querySelector(".send-btn");
    const input = chatBox.querySelector(".chat-input");
    const messages = chatBox.querySelector(".messages");
    const listingId = card.dataset.id;

    // Open chat on button click
    chatBtn.addEventListener("click", () => {
      body.style.display = "block";
    });

    // Close chat
    closeBtn.addEventListener("click", () => {
      body.style.display = "none";
    });

    // Send message
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    async function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;

      addMessage("user", msg);
      input.value = "";

      try {
        const res = await fetch(`/chat/listing/${listingId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ message: msg })
        });

        // Guard: if server returned HTML (e.g. login redirect), don't try to parse as JSON
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await res.json();
        addMessage("bot", data.reply);
      } catch (err) {
        console.error(err);
        addMessage("bot", "Sorry, something went wrong.");
      }
    }

    function addMessage(sender, text) {
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message", sender);
      msgDiv.textContent = text;
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
    }
  });
});
