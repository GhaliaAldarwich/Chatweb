import { Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import toast from "react-hot-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const sendAudio = useMutation(api.messages.sendAudio);
  const me = useQuery(api.users.getMe);
  const { selectedConversation } = useConversationStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Could not start recording.");
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!audioBlob || !me || !selectedConversation) return;

    try {
      const postUrl = await generateUploadUrl();
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });

      const { storageId } = await uploadResult.json();

      await sendAudio({
        audioId: storageId,
        conversation: selectedConversation._id,
        sender: me._id,
      });

      setAudioURL(null);
      setAudioBlob(null);
      toast.success("Voice message sent");
    } catch (error) {
      toast.error("Failed to send voice message.");
      console.error(error);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        size="sm"
        className="bg-transparent text-foreground hover:bg-transparent"
      >
        {isRecording ? <Square /> : <Mic />}
      </Button>

      {audioURL && (
        <Dialog open onOpenChange={() => setAudioURL(null)}>
          <DialogContent>
            {/* ✅ Accessibility: Visually hidden title */}
            <DialogTitle>
              <VisuallyHidden>Voice Message Preview</VisuallyHidden>
            </DialogTitle>

            <DialogDescription className="flex flex-col gap-4">
              <audio controls src={audioURL} className="w-full" />
              <Button className="w-full flex gap-2 border
   text-primary-foreground border-primary-foreground

    dark:bg-card dark:text-primary-foreground dark:border-card 

    hover:border
    dark:hover:bg-gray-tertiary dark:hover:text-white" onClick={handleSend}>Send Voice</Button>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default VoiceRecorder;
