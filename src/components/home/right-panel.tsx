"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, X } from "lucide-react";
import MessageInput from "./message-input";
import MessageContainer from "./message-container";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import GroupMembersDialog from "./group-members-dialog";
import { useConversationStore } from "@/store/chat-store";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const RightPanel = () => {
  const { selectedConversation, setSelectedConversation } = useConversationStore();
  const { isLoading } = useConvexAuth();
  const { user } = useUser();
  const router = useRouter();
  const startCall = useMutation(api.calls.startCall);

  // ✅ Avoid fetching if no conversation selected
  const activeCall = useQuery(
    api.calls.getActiveCall,
    selectedConversation ? { conversationId: selectedConversation._id } : "skip"
  );

  if (isLoading) return null;
  if (!selectedConversation) return <ChatPlaceHolder />;

  const conversationName = selectedConversation.groupName || selectedConversation.name;
  const conversationImage = selectedConversation.groupImage || selectedConversation.image;

  const handleStartCall = async () => {
    if (!user?.id) return;

    // ✅ If a call is already active, just join it
    if (activeCall?.isActive) {
      router.push(`/video-call?roomID=${activeCall.roomId}`);
      return;
    }

    const roomId = uuidv4();

    try {
      await startCall({
        conversationId: selectedConversation._id,
        roomId,
        createdBy: user.id,
      });

      router.push(`/video-call?roomID=${roomId}`);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  return (
    <div className="w-3/4 flex flex-col">
      {/* Header */}
      <div className="w-full sticky top-0 z-50">
        <div className="flex justify-between bg-gray-primary p-3">
          <div className="flex gap-3 items-center">
            <Avatar>
              <AvatarImage src={conversationImage || "/placeholder.png"} className="object-cover" />
              <AvatarFallback>
                <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p>{conversationName}</p>
              {selectedConversation.isGroup && (
                <GroupMembersDialog selectedConversation={selectedConversation} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-7 mr-5">
            <Video size={23} onClick={handleStartCall} className="cursor-pointer" />
            <X size={16} className="cursor-pointer" onClick={() => setSelectedConversation(null)} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageContainer />

      {/* Input */}
      <MessageInput />


              

    </div>
  );
};

export default RightPanel;
