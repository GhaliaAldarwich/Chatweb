import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Crown } from "lucide-react";
import { Conversation } from "@/store/chat-store";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // or next/router if using older Next.js

type GroupMembersDialogProps = {
	selectedConversation: Conversation;
};

const GroupMembersDialog = ({ selectedConversation }: GroupMembersDialogProps) => {
	const users = useQuery(api.users.getGroupMembers, {
		conversationId: selectedConversation._id,
	});

	const leaveGroup = useMutation(api.conversations.leaveGroup);
	const router = useRouter();

	const handleLeaveGroup = async () => {
		try {
			await leaveGroup({ conversationId: selectedConversation._id });
			router.refresh(); // Refresh conversation list or redirect user
		} catch (err) {
			console.error("Failed to leave group", err);
		}
	};

	return (
		<Dialog>
			<DialogTrigger>
				<p className="text-xs text-muted-foreground text-left">See members</p>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="my-2">Current Members</DialogTitle>
					<DialogDescription>This is a list of current members.</DialogDescription>

					<div className="flex flex-col gap-3 mb-4">
						{users?.map((user) => (
							<div key={user._id} className="flex gap-3 items-center p-2 rounded">
								<Avatar className="overflow-visible">
									{user.isOnline && (
										<div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-foreground" />
									)}
									<AvatarImage src={user.image} className="rounded-full object-cover" />
									<AvatarFallback>
										<div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full"></div>
									</AvatarFallback>
								</Avatar>

								<div className="w-full">
									<div className="flex items-center gap-2">
										<h3 className="text-md font-medium">
											{user.name || user.email.split("@")[0]}
										</h3>
										{user._id === selectedConversation.admin && (
											<Crown size={16} className="text-yellow-400" />
										)}
									</div>
								</div>
							</div>
						))}
					</div>

					{/* 🔴 Leave Group Button */}
					<Button
  onClick={handleLeaveGroup}
  className="w-full text-white border border-white bg-[#291f29] hover:bg-[#1c1219] px-3 py-1.5 rounded-md text-sm transition-colors !mt-4"

>
  Leave Group
</Button>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default GroupMembersDialog;
