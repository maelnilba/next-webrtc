import { pusher } from "lib/pusher";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { socket_id, channel_name } = req.body;
  const authResponse = pusher.authenticate(socket_id, channel_name, {
    user_id: (Math.random() * 10000).toString(),
    user_info: {
      attr: "test",
    },
  });
  res.send(authResponse);
}
