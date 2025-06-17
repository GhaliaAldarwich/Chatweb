import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const startCall = mutation({
  args: {
    conversationId: v.id("conversations"),
    roomId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing active call
    const existingCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // If an active call exists, deactivate it
    if (existingCall) {
      await ctx.db.patch(existingCall._id, { isActive: false });
    }

    // Create new call
    await ctx.db.insert("calls", {
      conversationId: args.conversationId,
      roomId: args.roomId,
      createdBy: args.createdBy,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});


