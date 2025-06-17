import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
	path: "/clerk",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		const payloadString = await req.text();
		const headerPayload = req.headers;

		try {
			const result = await ctx.runAction(internal.clerk.fulfill, {
				payload: payloadString,
				headers: {
					"svix-id": headerPayload.get("svix-id")!,
					"svix-signature": headerPayload.get("svix-signature")!,
					"svix-timestamp": headerPayload.get("svix-timestamp")!,
				},
			});

			switch (result.type) {
				case "user.created":
  const firstName = result.data.first_name?.trim();
  const lastName = result.data.last_name?.trim();
  const fallbackName = result.data.email_addresses[0]?.email_address?.split("@")[0] ?? "Guest";
  const fullName = firstName || lastName
    ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
    : fallbackName;

  await ctx.runMutation(internal.users.createUser, {
    tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.id}`,
    email: result.data.email_addresses[0]?.email_address,
    name: fullName,
    image: result.data.image_url,
  });
  break;
			case "user.updated":
  const first = result.data.first_name?.trim();
  const last = result.data.last_name?.trim();
  const fallback = result.data.email_addresses[0]?.email_address?.split("@")[0] ?? "Guest";
  const updatedName = first || last
    ? `${first ?? ""} ${last ?? ""}`.trim()
    : fallback;

  await ctx.runMutation(internal.users.updateUser, {
    tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.id}`,
    image: result.data.image_url,
    name: updatedName,
  });
  break;

				case "session.created":
					await ctx.runMutation(internal.users.setUserOnline, {
						tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.user_id}`,
					});
					break;
				case "session.ended":
					await ctx.runMutation(internal.users.setUserOffline, {
						tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${result.data.user_id}`,
					});
					break;
			}

			return new Response(null, {
				status: 200,
			});
		} catch (error) {
			console.log("Webhook Error🔥🔥", error);
			return new Response("Webhook Error", {
				status: 400,
			});
		}
	}),
});

export default http;

