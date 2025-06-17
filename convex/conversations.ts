import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const createConversation = mutation({
	args: {
		participants: v.array(v.id("users")),
		isGroup: v.boolean(),
		groupName: v.optional(v.string()),
		groupImage: v.optional(v.id("_storage")),
		admin: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Unauthorized");
	  
		// 🔒 Ensure consistent order of participant IDs
		const sortedParticipants = [...args.participants].sort();
	  
		// ✅ Only check for existing conversation if it's NOT a group
		if (!args.isGroup) {
		  const existingConversation = await ctx.db
			.query("conversations")
			.filter((q) => q.eq(q.field("participants"), sortedParticipants))
			.first();
	  
		  if (existingConversation) {
			return existingConversation._id;
		  }
		}
	  
		let groupImage;
	  
		if (args.groupImage) {
		  groupImage = (await ctx.storage.getUrl(args.groupImage)) as string;
		}
	  
		const conversationId = await ctx.db.insert("conversations", {
		  participants: sortedParticipants, // 🧠 Always store sorted
		  isGroup: args.isGroup,
		  groupName: args.groupName,
		  groupImage,
		  admin: args.admin,
		});
	  
		return conversationId;
	  },
});

export const getMyConversations = query({
	args: {},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Unauthorized");

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique();

		if (!user) throw new ConvexError("User not found");

		const conversations = await ctx.db.query("conversations").collect();

		const myConversations = conversations.filter((conversation) => {
			return conversation.participants.includes(user._id);
		});

		const conversationsWithDetails = await Promise.all(
			myConversations.map(async (conversation) => {
				let userDetails = {};

				if (!conversation.isGroup) {
					const otherUserId = conversation.participants.find((id) => id !== user._id);
					const userProfile = await ctx.db
						.query("users")
						.filter((q) => q.eq(q.field("_id"), otherUserId))
						.take(1);

					userDetails = userProfile[0];
				}

				const lastMessage = await ctx.db
					.query("messages")
					.filter((q) => q.eq(q.field("conversation"), conversation._id))
					.order("desc")
					.take(1);

				
				return {
					...userDetails,
					...conversation,
					lastMessage: lastMessage[0] || null,
				};
			})
		);

		return conversationsWithDetails;
	},
});

export const kickUser = mutation({
	args: {
		conversationId: v.id("conversations"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError("Unauthorized");

		const conversation = await ctx.db
			.query("conversations")
			.filter((q) => q.eq(q.field("_id"), args.conversationId))
			.unique();

		if (!conversation) throw new ConvexError("Conversation not found");

		await ctx.db.patch(args.conversationId, {
			participants: conversation.participants.filter((id) => id !== args.userId),
		});
	},
});



export const leaveGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new ConvexError("User not found");

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .unique();

    if (!conversation) throw new ConvexError("Conversation not found");
    if (!conversation.isGroup) throw new ConvexError("Cannot leave a non-group chat");

    // If user not in participants
    if (!conversation.participants.includes(user._id)) {
      throw new ConvexError("You are not a participant of this group");
    }

    // Remove user from participants
    const updatedParticipants = conversation.participants.filter((id) => id !== user._id);

    // Handle admin reassignment
    let newAdmin = conversation.admin;

    if (String(conversation.admin) === String(user._id)) {
      // Only reassign if there are other members
      if (updatedParticipants.length > 0) {
        const randomIndex = Math.floor(Math.random() * updatedParticipants.length);
        newAdmin = updatedParticipants[randomIndex];
      } else {
        newAdmin = undefined; // No participants left
      }
    }

    await ctx.db.patch(args.conversationId, {
      participants: updatedParticipants,
      admin: newAdmin,
    });

    return { success: true, newAdmin };
  },
});




export const generateUploadUrl = mutation(async (ctx) => {

 return await ctx.storage.generateUploadUrl();


});