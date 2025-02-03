import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "https://api.green-api.com";

function App() {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!idInstance || !apiTokenInstance || !phoneNumber || !message) return;
    try {
      const url = `${API_BASE}/waInstance${idInstance}/SendMessage/${apiTokenInstance}`;
      const payload = {
        chatId: `${phoneNumber}@c.us`,
        message: message,
      };
      const response = await axios.post(url, payload);
      if (response.data.idMessage) {
        setChat((prev) => [...prev, { sender: "me", text: message }]);
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message", error.response?.data || error);
    }
  };

  const deleteMessage = async (receiptId) => {
    try {
      const deleteUrl = `${API_BASE}/waInstance${idInstance}/DeleteNotification/${apiTokenInstance}/${receiptId}`;
      await axios.delete(deleteUrl);
    } catch (error) {
      console.error("Error deleting message", error);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {

      if (!idInstance || !apiTokenInstance) return;
      try {
        const url = `${API_BASE}/waInstance${idInstance}/ReceiveNotification/${apiTokenInstance}`;
        const response = await axios.get(url, { timeout: 10000 }); // Ждем 10 секунд

        if (response.data && response.data.body) {
          const messageText = response.data.body.messageData?.textMessageData?.textMessage;
          const sender = response.data.body.senderData?.senderName || response.data.body.senderData?.sender;
          if (messageText && sender) {
            setChat((prev) => [...prev, { sender: sender, text: messageText }]);
          }
          if (response.data.receiptId) {
            await deleteMessage(response.data.receiptId);
          }
        }
      } catch (error) {
        console.error("Error receiving messages", error.response?.data || error);
      }
    };
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [idInstance, apiTokenInstance]);

  return (
    <div className="app">
      <h1>WhatsApp Chat</h1>
      <input type="text" placeholder="idInstance" value={idInstance} onChange={(e) => setIdInstance(e.target.value)} />
      <input type="text" placeholder="apiTokenInstance" value={apiTokenInstance} onChange={(e) => setApiTokenInstance(e.target.value)} />
      <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      <div className="chat-window">
        {chat.map((msg, index) => (
          <div key={index} className={msg.sender === "me" ? "my-message" : "their-message"}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
