"use client";
import { ListFilter, LogOut, MessageSquareDiff, Search, User } from "lucide-react";
import { Input } from "../ui/input";
import ThemeSwitch from "./theme-switch";
import Conversation from "./conversation";
import { UserButton } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignIn, SignOutButton } from "@clerk/clerk-react";
import UserListDialog from "./user-list-dialog"
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useConversationStore } from "@/store/chat-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const LeftPanel = () => {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const conversations = useQuery(api.conversations.getMyConversations, isAuthenticated ? undefined : "skip");
	const { selectedConversation, setSelectedConversation } = useConversationStore();
	const [filterType, setFilterType] = useState<"all" | "group" | "private">("all");


	const [searchTerm, setSearchTerm] = useState(""); // ✅ Search input state

	useEffect(() => {
		const conversationIds = conversations?.map((conversation) => conversation._id);
		if (selectedConversation && conversationIds && !conversationIds.includes(selectedConversation._id)) {
			setSelectedConversation(null);
		}
	}, [conversations, selectedConversation, setSelectedConversation]);

	if (isLoading) return null;

	// ✅ Filter conversations based on searchTerm
const filteredConversations = (conversations as {
  _id: string;
  groupName?: string;
  name?: string;
  isGroup?: boolean;
}[])?.filter((conversation) => {
  const name = conversation.groupName || conversation.name || "";
  const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

  if (filterType === "group" && !conversation.isGroup) return false;
  if (filterType === "private" && conversation.isGroup) return false;

  return matchesSearch;
});



	return (
		<div className='w-1/4 border-gray-600 border-r'>
			<div className='sticky top-0 bg-left-panel z-10'>
				{/* Header */}
				<div className='flex justify-between bg-gray-primary p-3 items-center'>
					<UserButton />

					<div className='flex items-center gap-3'>
						{isAuthenticated && <UserListDialog />}
						<ThemeSwitch />
					</div>
				</div>

				{/* Search */}
				<div className='p-3 flex items-center'>
					<div className='relative h-10 mx-3 flex-1'>
						<Search
							className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10'
							size={18}
						/>
						<Input
							type='text'
							placeholder='Search or start a new chat'
							className='pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)} // ✅ Update on change
						/>
					</div>
				<DropdownMenu>
  					<DropdownMenuTrigger asChild>
    				<ListFilter className="cursor-pointer" />
 					 </DropdownMenuTrigger>
  					<DropdownMenuContent className="bg-gray-primary">
   					 <DropdownMenuItem onClick={() => setFilterType("all")}>All Chats</DropdownMenuItem>
   					 <DropdownMenuItem onClick={() => setFilterType("group")}>Group Chats</DropdownMenuItem>
   					 <DropdownMenuItem onClick={() => setFilterType("private")}>Private Chats</DropdownMenuItem>
 					 </DropdownMenuContent>
			</DropdownMenu>
       
				</div>
			</div>

			{/* Chat List */}
			<div className='my-3 flex flex-col gap-0 max-h-[80%] overflow-auto'>
				{/* ✅ Use filtered conversations */}
				{filteredConversations?.map((conversation) => (
					<Conversation key={conversation._id} conversation={conversation} />
				))}

				{filteredConversations?.length === 0 && (
					<>
						<p className='text-center text-gray-500 text-sm mt-3'>No conversations found</p>
						<p className='text-center text-gray-500 text-sm mt-3 '>
							We understand {"you're"} an introvert, but {"you've"} got to start somewhere 😊
						</p>
					</>
				)}
			</div>
		</div>
	);
};

export default LeftPanel;
