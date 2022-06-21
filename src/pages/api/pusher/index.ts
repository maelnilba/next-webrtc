import { pusher } from "lib/pusher";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
    await pusher.trigger("presence-channel", "channel-event", {
      type,
      payload,
      sender,
    });
  }

  res.json({ message: "completed" });
}
