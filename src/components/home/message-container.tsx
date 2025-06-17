import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ChatBubble from "./chat-bubble";
import { useConversationStore } from "@/store/chat-store";

const MessageContainer = () => {
  const { selectedConversation } = useConversationStore();
  
  // Fetch messages
  const messages = useQuery(api.messages.getMessages, {
    conversation: selectedConversation!._id,
  });

  // Fetch user data (me)
  const me = useQuery(api.users.getMe);

  // Reference to the container for scrolling
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    if (messageContainerRef.current) {
      // Scroll to bottom of the container
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]); // Trigger when messages change

  return (
    <div
      ref={messageContainerRef} // Apply the ref to the container
      className="relative p-3 flex-1 overflow-auto h-full bg-chat-tile-light dark:bg-chat-tile-dark"
    >
      <div className="mx-12 flex flex-col gap-3">
        {messages?.map((msg, idx) => (
          <div key={msg._id}>
            <ChatBubble
              message={msg}
              me={me} // Now passing the correct `me` object
              previousMessage={idx > 0 ? messages[idx - 1] : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageContainer;
