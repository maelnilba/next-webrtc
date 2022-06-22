import { pusher } from "lib/pusher";
import { NextApiRequest, NextApiResponse } from "next";
import { ACTIONS } from "shared/actions-socket";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { room } = req.query;
  const { action, socketId, data } = req.body;
  if (action === ACTIONS.JOIN) {
    const { user } = data;
    await pusher.trigger(
      `presence-channel-${room}`,
      ACTIONS.ADD_PEER,
      {
        peerId: socketId,
        createOffer: false,
        user,
      },
      {
        socket_id: socketId,
      }
    );
  }

  if (action === ACTIONS.ADD_PEER_RESPONSE) {
    const { peerId, createOffer, user } = data;
    await pusher.trigger(`socket-channel-${peerId}-${room}`, ACTIONS.ADD_PEER, {
      peerId: socketId,
      createOffer,
      user,
    });
  }

  if (action === ACTIONS.RELAY_ICE) {
    const { peerId, icecandidate } = data;
    await pusher.trigger(
      `socket-channel-${peerId}-${room}`,
      ACTIONS.ICE_CANDIDATE,
      {
        peerId: socketId,
        icecandidate,
      }
    );
  }
  if (action === ACTIONS.RELAY_SDP) {
    const { peerId, sessionDescription } = data;
    await pusher.trigger(
      `socket-channel-${peerId}-${room}`,
      ACTIONS.SESSION_DESCRIPTION,
      {
        peerId: socketId,
        sessionDescription,
      }
    );
  }

  if (action === ACTIONS.LEAVE) {
    pusher.trigger(`presence-channel-${room}`, ACTIONS.REMOVE_PEER, {
      peerId: socketId,
    });
  }

  if (action === ACTIONS.TALKING) {
    const { isTalking, user } = data;
    pusher.trigger(`presence-channel-${room}`, ACTIONS.RELAY_TALKING, {
      isTalking,
      user,
    });
  }

  res.json({ message: "completed" });
}
