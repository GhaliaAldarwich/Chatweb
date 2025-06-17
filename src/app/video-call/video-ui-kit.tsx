"use client";

import { useClerk } from "@clerk/nextjs";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { randomID } from "@/lib/utils";

function getUrlParams(url = window.location.href) {
  const urlStr = url.split("?")[1];
  return new URLSearchParams(urlStr);
}

export default function VideoUIKit() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roomID = getUrlParams().get("roomID") || randomID(5);
  const { user } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (!user || !containerRef.current) return;

    const initMeeting = async () => {
      try {
        // Fetch ZegoCloud token from your backend
        const res = await fetch(`/api/zegocloud?userID=${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch token from server.");
        }
        const { token, appID } = await res.json();

        // Set user name and avatar
        const username = user.fullName || user.emailAddresses[0].emailAddress.split("@")[0];
        const avatar = user.imageUrl;

        // Generate the kit token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          appID,
          token,
          roomID,
          user.id,
          username
        );

        // Create and join the room
        const zp = ZegoUIKitPrebuilt.create(kitToken);

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: "Personal link",
              url: `${window.location.origin}${window.location.pathname}?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
        });
      } catch (err) {
        console.error("Failed to initialize video call:", err);
        alert("Something went wrong while joining the call.");
        router.push("/"); // Or redirect elsewhere if there's an error
      }
    };

    initMeeting();
  }, [user, roomID]);

  return <div className="myCallContainer" ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
