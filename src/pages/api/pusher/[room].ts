import { pusher } from "lib/pusher";
import { NextApiRequest, NextApiResponse } from "next";
import { ACTIONS } from "shared/actions-socket";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { room } = req.query;
  const { action, socketId, data } = req.body;
  console.log(req.body);
  switch (action) {
    case ACTIONS.JOIN:
      const { roomId, user } = data;
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

      break;
    case ACTIONS.ADD_PEER_RESPONSE:
      const { peerId, createOffer, user: _user } = data;
      await pusher.trigger(
        `socket-channel-${peerId}-${room}`,
        ACTIONS.ADD_PEER,
        {
          peerId: socketId,
          createOffer,
          user: _user,
        }
      );
      break;
    case ACTIONS.RELAY_ICE:
      const { peerId: _peerId, icecandidate } = data;
      await pusher.trigger(
        `socket-channel-${_peerId}-${room}`,
        ACTIONS.ICE_CANDIDATE,
        {
          peerId: socketId,
          icecandidate,
        }
      );
      break;
    case ACTIONS.RELAY_SDP:
      const { peerId: __peerId, sessionDescription } = data;
      await pusher.trigger(
        `socket-channel-${__peerId}-${room}`,
        ACTIONS.SESSION_DESCRIPTION,
        {
          peerId: socketId,
          sessionDescription,
        }
      );
      break;
    default:
      break;
  }

  res.json({ message: "completed" });
}
