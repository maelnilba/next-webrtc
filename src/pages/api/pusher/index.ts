import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const channelEventSchema = z.object({
  type: z.string().regex(/offer|answer|candidate|join|accept/g),
  payload: z.string(),
  sender: z.string().min(1),
});

export type channelEvent = z.infer<typeof channelEventSchema>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { type, payload, sender } = req.body;
  const request = channelEventSchema.safeParse({ type, payload, sender });

  if (request.success) {
    await pusher.trigger("channel", "channel-event", {
      type,
      payload,
      sender,
    });
  }

  res.json({ message: "completed" });
}
