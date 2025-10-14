document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("global-chat-btn");
  const chatBox = document.getElementById("global-chat-box");
  const closeBtn = document.getElementById("close-chat");
  const sendBtn = document.getElementById("global-send");
  const input = document.getElementById("global-input");
  const messages = document.getElementById("global-messages");

  chatBtn.addEventListener("click", () => {
    chatBox.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    chatBox.style.display = "none";
  });

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if(e.key === "Enter") sendMessage();
  });

  async function sendMessage(){
    const msg = input.value.trim();
    if(!msg) return;

    addMessage("user", msg);
    input.value = "";

    try{
      const res = await fetch("/chat/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });

      const data = await res.json();
      addMessage("bot", data.reply);
    } catch(err){
      console.error(err);
      addMessage("bot", "Sorry, something went wrong.");
    }
  }

  function addMessage(sender, text){
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    msgDiv.innerHTML = text;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }
});
