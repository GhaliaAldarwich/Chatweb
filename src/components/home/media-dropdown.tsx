import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FileText, ImageIcon, Plus, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";
import ReactPlayer from "react-player";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const MediaDropdown = () => {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const sendImage = useMutation(api.messages.sendImage);
  const sendVideo = useMutation(api.messages.sendVideo);
  const sendDocument = useMutation(api.messages.sendDocument);
  const me = useQuery(api.users.getMe);
  const { selectedConversation } = useConversationStore();

  const handleSend = async (
    file: File,
    contentType: string,
    sendFn: Function,
    argKey: string
  ) => {
    setIsLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: file,
      });

      const { storageId } = await result.json();

      await sendFn({
        [argKey]: storageId,
        conversation: selectedConversation!._id,
        sender: me!._id,
      });

      if (argKey === "imgId") setSelectedImage(null);
      if (argKey === "videoId") setSelectedVideo(null);
      if (argKey === "documentId") setSelectedDocument(null);
    } catch (error) {
      toast.error("Failed to send media");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={imageInput}
        accept="image/*"
        onChange={(e) => setSelectedImage(e.target.files![0])}
        hidden
      />
      <input
        type="file"
        ref={videoInput}
        accept="video/mp4"
        onChange={(e) => setSelectedVideo(e.target.files![0])}
        hidden
      />
    <input
  type="file"
  ref={documentInput}
  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.md,.csv,.zip,.rar,.7z,.tar,.gz,.json,.xml,.html"
  onChange={(e) => setSelectedDocument(e.target.files![0])}
  hidden
/>

      {selectedImage && (
        <MediaImageDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          selectedImage={selectedImage}
          isLoading={isLoading}
          handleSendImage={() =>
            handleSend(selectedImage, selectedImage.type, sendImage, "imgId")
          }
        />
      )}

      {selectedVideo && (
        <MediaVideoDialog
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          selectedVideo={selectedVideo}
          isLoading={isLoading}
          handleSendVideo={() =>
            handleSend(selectedVideo, selectedVideo.type, sendVideo, "videoId")
          }
        />
      )}

      {selectedDocument && (
        <MediaDocumentDialog
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          selectedDocument={selectedDocument}
          isLoading={isLoading}
          handleSendDocument={() =>
            handleSend(
              selectedDocument,
              selectedDocument.type,
              sendDocument,
              "documentId"
            )
          }
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="text-gray-600 dark:text-gray-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => imageInput.current!.click()}>
            <ImageIcon size={18} className="mr-1" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInput.current!.click()}>
            <Video size={20} className="mr-1" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => documentInput.current!.click()}>
            <FileText size={18} className="mr-1" />
            Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MediaDropdown;

type MediaImageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: File;
  isLoading: boolean;
  handleSendImage: () => void;
};

const MediaImageDialog = ({
  isOpen,
  onClose,
  selectedImage,
  isLoading,
  handleSendImage,
}: MediaImageDialogProps) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Send Image</DialogTitle>
        </VisuallyHidden>
        <DialogDescription className="flex flex-col gap-10 justify-center items-center">
          {renderedImage && (
            <Image src={renderedImage} width={300} height={300} alt="selected image" />
          )}
          <Button className="w-full" disabled={isLoading} onClick={handleSendImage}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

type MediaVideoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: File;
  isLoading: boolean;
  handleSendVideo: () => void;
};

const MediaVideoDialog = ({
  isOpen,
  onClose,
  selectedVideo,
  isLoading,
  handleSendVideo,
}: MediaVideoDialogProps) => {
  const renderedVideo = URL.createObjectURL(selectedVideo);

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Send Video</DialogTitle>
        </VisuallyHidden>
        <DialogDescription>Video</DialogDescription>
        <div className="w-full">
          {renderedVideo && <ReactPlayer url={renderedVideo} controls width="100%" />}
        </div>
        <Button className="w-full" disabled={isLoading} onClick={handleSendVideo}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

type MediaDocumentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDocument: File;
  isLoading: boolean;
  handleSendDocument: () => void;
};

const MediaDocumentDialog = ({
  isOpen,
  onClose,
  selectedDocument,
  isLoading,
  handleSendDocument,
}: MediaDocumentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Send Document</DialogTitle>
        </VisuallyHidden>
        <DialogDescription className="text-center">
          Document: <strong>{selectedDocument.name}</strong>
        </DialogDescription>
        <Button className="w-full" disabled={isLoading} onClick={handleSendDocument}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
