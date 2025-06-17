import { MessageSeenSvg } from "@/lib/svgs";
import { IMessage, useConversationStore } from "@/store/chat-store";
import ChatBubbleAvatar from "./chat-bubble-avatar";
import DateIndicator from "./date-indicator";
import ReactPlayer from "react-player";
import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Bot, X } from "lucide-react";
import ChatAvatarActions from "./chat-avatar-actions";
import { FileText, FileArchive, File } from "lucide-react";

import { FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";



type chatBubbleProps = {
	message:IMessage;
	me:any;
	previousMessage?:IMessage;
}

const ChatBubble = ({me,message,previousMessage}:chatBubbleProps) => {

	const date = new Date(message._creationTime);
	const hour = date.getHours().toString().padStart(2, "0");
	const minute = date.getMinutes().toString().padStart(2, "0");
	const time = `${hour}:${minute}`;
	

	const { selectedConversation } = useConversationStore();
	const isMember = selectedConversation?.participants.includes(message.sender?._id) || false;
	const isGroup = selectedConversation?.isGroup;
	const fromMe = message.sender?._id === me._id;
	const fromAI = message.sender?.name === "ChatGPT";
	const bgClass = fromMe ? "bg-green-chat" : !fromAI ? "bg-white dark:bg-gray-primary" : "bg-purple-600 text-white";




	console.log(message.sender);
	const [open,setOpen] = useState(false);

	const renderMessageContent = () => {
		switch (message.messageType) {
			case "text":
				return <TextMessage message={message} />;
			case "image":
				return <ImageMessage message={message} handleClick={() => setOpen(true)} />;
			case "video":
				return <VideoMessage message={message} />;
			case "audio":
				return <AudioMessage message={message} />;
			case "document":
				return <DocumentMessage message={message} />;
			default:
				return null;
		}
	};

	if(!fromMe) {
		return (
			<>
			<DateIndicator message={message} previousMessage={previousMessage} />
			<div className="flex gap-1 w-2/3">
			<ChatBubbleAvatar isGroup={isGroup} isMember={isMember} message={message} fromAI={fromAI}/>
				
			<div className={`flex flex-col z-20 max-w-fit px-2 pt-1 rounded-md shadow-md relative ${bgClass}`}>
				{!fromAI && <OtherMessageIndicator />}
				{fromAI && <Bot size={16} className='absolute bottom-[2px] left-2' />}
				{<ChatAvatarActions message={message} me={me} />}

				  

				{renderMessageContent()}
				{open && <ImageDialog src={message.content} open={open} onClose={() => setOpen(false)} />}
				<MessageTime time={time} fromMe={fromMe}/>

			</div>
			
			</div>
			 </>
		);
	}
	return (
		<>
		<DateIndicator message={message} previousMessage={previousMessage} />
			<div className="flex gap-1 w-2/3 ml-auto">
			<div className={`flex z-20 max-w-fit px-2 pt-1 rounded-md shadow-md ml-auto relative ${bgClass}`}>
				<SelfMessageIndicator />
				{renderMessageContent()}
				{open && <ImageDialog src={message.content} open={open} onClose={() => setOpen(false)} />}
				<MessageTime time={time} fromMe={fromMe}/>
			</div>
			</div>
		</>
		);
	
};
export default ChatBubble;

const VideoMessage = ({ message }: { message: IMessage }) => {
	return <ReactPlayer url={message.content} width='250px' height='250px' controls={true} light={true} />;
};

const ImageMessage = ({ message, handleClick }: { message: IMessage; handleClick: () => void }) => {
	return (
		<div className='w-[250px] h-[250px] m-2 relative'>
			<Image
				src={message.content}
				fill
				className='cursor-pointer object-cover rounded'
				alt='image'
				onClick={handleClick}
			/>
		</div>
	);
};

const ImageDialog = ({ src, open, onClose }: { src: string; open: boolean; onClose: () => void }) => {
	return (
	  <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
		<Dialog.Portal>
		  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
  
		  <Dialog.Content
			className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
			w-[90vw] max-w-[750px] h-[80vh] bg-[hsl(300,12%,22%)] rounded-lg shadow-xl overflow-hidden"
		  >
			{/* Close button */}
			<Dialog.Close asChild>
			  <button
				className="absolute top-3 right-3 text-white hover:text-gray-300 transition z-50"
				aria-label="Close"
			  >
				<X size={24} />
			  </button>
			</Dialog.Close>
  
			<Dialog.Title className="sr-only">Image Preview</Dialog.Title>
  
			<Dialog.Description className="w-full h-full relative">
			  <Image src={src} alt="Preview" fill className="object-contain rounded-lg" />
			</Dialog.Description>
		  </Dialog.Content>
		</Dialog.Portal>
	  </Dialog.Root>
	);
  };

const MessageTime = ({ time, fromMe }: { time: string; fromMe: boolean }) => {
	return (
		<p className='text-[10px] mt-2 self-end flex gap-1 items-center'>
			{time} {fromMe && <MessageSeenSvg />}
		</p>
	);
};

const OtherMessageIndicator = () => (
	<div className='absolute bg-white dark:bg-gray-primary top-0 -left-[4px] w-3 h-3 rounded-bl-full' />
);

const SelfMessageIndicator = () => (
	<div className='absolute bg-green-chat top-0 -right-[3px] w-3 h-3 rounded-br-full overflow-hidden' />
);

const TextMessage = ({ message }: { message: IMessage }) => {
	const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.content); // Check if the content is a URL

	return (
		<div>
			{isLink ? (
				<a
					href={message.content}
					target='_blank'
					rel='noopener noreferrer'
					className={`mr-2 text-sm font-light text-blue-400 underline`}
				>
					{message.content}
				</a>
			) : (
				<p className={`mr-2 text-sm font-light`}>{message.content}</p>
			)}
		</div>
	);
};

const AudioMessage = ({ message }: { message: IMessage }) => {
	return (
	  <div className="w-[250px] mt-2">
		<audio controls className="w-full">
		  <source src={message.content} type="audio/webm" />
		  Your browser does not support the audio element.
		</audio>
	  </div>
	);
  };


 const DocumentMessage = ({ message }: { message: IMessage }) => {
	const fileUrl = message.content;
	const fileName = fileUrl.split("/").pop() || "document";
	const fileExtension = fileName.split(".").pop()?.toLowerCase();

const getIcon = () => {
	switch (fileExtension) {
		case "pdf":
			return <FaFilePdf className="text-red-600" size={24} />;
		case "doc":
		case "docx":
			return <FaFileWord className="text-blue-600" size={24} />;
		default:
			return <FaFileAlt className="text-gray-400" size={24} />;
	}
};
	return (
		<a
			href={fileUrl}
			download
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center gap-3 px-4 py-2 mt-1 rounded-lg shadow-sm bg-[rgb(63,49,63)] text-white hover:opacity-90 transition-colors max-w-[250px]"
		>
			<div>{getIcon()}</div>
			<div className="flex flex-col overflow-hidden">
				<p className="text-sm font-medium truncate">{fileName}</p>
				<p className="text-xs text-gray-300">Tap to download</p>
			</div>
		</a>
	);
};

