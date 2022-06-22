import { useRef, useCallback, useEffect } from "react";
import { useStateWithCallback } from "@hooks/useStateWithCallback";
import { useEffectOnce } from "./useEffectOnce";
import { Channel, Members, PresenceChannel } from "pusher-js";
import { ACTIONS } from "shared/actions-socket";

type User = {
  id: string;
  name: string;
};

type WebRTCProps = {
  roomId: string;
  socket: PresenceChannel;
  emitter: Channel;
  socketId: string;
  user: User;
};

export const useWebRTC = (
  { roomId, socket, emitter, socketId, user }: WebRTCProps,
  userMedia?: MediaStreamConstraints
) => {
  const [clients, setClients] = useStateWithCallback([]);
  const audioElements = useRef<any>({});
  const connections = useRef<{ [key: string]: any }>({});
  const localMediaStream = useRef<MediaStream | null>(null);
  const pusher = useRef<PresenceChannel | null>(null);
  const emitPusher = useRef<Channel | null>(null);
  const emit = async (action: any, ...args: any[]) => {
    await fetch(`api/pusher/${roomId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        socketId: socketId,
        data: { ...args[0] },
      }),
    });
  };

  useEffectOnce(() => {
    pusher.current = socket;
    emitPusher.current = emitter;
  });

  const addNewClient = useCallback(
    (newClient: any, cb: Function) => {
      const lookingFor = clients.find(
        (client: any) => client.id === newClient.id
      );

      if (lookingFor === undefined) {
        setClients(
          (existingClients: any) => [...existingClients, newClient],
          cb
        );
      }
    },
    [clients, setClients]
  );

  // Capture media

  useEffect(() => {
    const startCapture = async () => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia(
        userMedia || {
          video: true,
          audio: false,
        }
      );
    };

    startCapture().then(() => {
      addNewClient(user, () => {
        const localElement = audioElements.current[user.id];
        if (localElement) {
          localElement.volume = 0;
          localElement.srcObject = localMediaStream.current;
        }

        emit(ACTIONS.JOIN, { roomId, user });
      });
    });

    return () => {
      // Leaving the room
      localMediaStream.current?.getTracks().forEach((track) => track.stop());

      emit(ACTIONS.LEAVE);
    };
  }, []);

  useEffect(() => {
    const handleNewPeer = async ({
      peerId,
      createOffer,
      user: remoteUser,
    }: {
      peerId: string;
      createOffer: string;
      user: { id: string; name: string };
    }) => {
      // if already connected then give warning
      if (peerId in connections.current) {
        return console.warn(
          `You are already connected with ${peerId} (${user.name})`
        );
      }

      connections.current[peerId] = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun1.1.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      });

      // Handle new ice candidate
      connections.current[peerId].onicecandidate = (
        event: RTCPeerConnectionIceEvent
      ) => {
        emit(ACTIONS.RELAY_ICE, {
          peerId,
          icecandidate: event.candidate,
        });
      };

      // Handle on track on this connection
      connections.current[peerId].ontrack = ({
        streams: [remoteStream],
      }: {
        streams: [MediaStream];
      }) => {
        addNewClient(remoteUser, () => {
          if (audioElements.current[remoteUser.id]) {
            audioElements.current[remoteUser.id].srcObject = remoteStream;
          } else {
            let settled = false;
            const interval = setInterval(() => {
              if (audioElements.current[remoteUser.id]) {
                audioElements.current[remoteUser.id].srcObject = remoteStream;
                settled = true;
              }
              if (settled) {
                clearInterval(interval);
              }
            }, 1000);
          }
        });
      };

      // Add local track to remote connections
      localMediaStream.current?.getTracks().forEach((track) => {
        connections.current[peerId].addTrack(track, localMediaStream.current);
      });

      // Create offer
      if (createOffer) {
        const offer = await connections.current[peerId].createOffer();
        await connections.current[peerId].setLocalDescription(offer);

        emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: offer,
        });
      } // send to another client our infos
      else {
        emit(ACTIONS.ADD_PEER_RESPONSE, {
          peerId,
          createOffer: true,
          user: {
            id: user.id,
            name: user.name,
          },
        });
      }
    };

    pusher.current?.bind(ACTIONS.ADD_PEER, handleNewPeer);
    emitPusher.current?.bind(ACTIONS.ADD_PEER, handleNewPeer);
    return () => {
      pusher.current?.unbind(ACTIONS.ADD_PEER);
      emitPusher.current?.unbind(ACTIONS.ADD_PEER);
    };
  }, []);

  // Handle ice candidate
  useEffect(() => {
    const handleIceCandidate = ({
      peerId,
      icecandidate,
    }: {
      peerId: string;
      icecandidate: RTCIceCandidate;
    }) => {
      try {
        if (icecandidate) {
          (connections.current[peerId] as RTCPeerConnection)
            .addIceCandidate(icecandidate)
            .catch((error) => {
              console.warn(error);
            });
        }
      } catch (error) {
        //
      }
    };

    emitPusher.current?.bind(ACTIONS.ICE_CANDIDATE, handleIceCandidate);

    return () => {
      emitPusher.current?.unbind(ACTIONS.ICE_CANDIDATE);
    };
  }, []);

  // Handle SDP
  useEffect(() => {
    const handleRemoteSdp = async ({
      peerId,
      sessionDescription: remoteSessionDescription,
    }: {
      peerId: string;
      sessionDescription: RTCSessionDescriptionInit;
    }) => {
      connections.current[peerId].setRemoteDescription(
        new RTCSessionDescription(remoteSessionDescription)
      );

      // if session description is type of offer then create an answer

      if (remoteSessionDescription.type === "offer") {
        const connection = connections.current[peerId];
        const answer = await connection.createAnswer();

        connection.setLocalDescription(answer);

        emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        });
      }
    };
    emitPusher.current?.bind(ACTIONS.SESSION_DESCRIPTION, handleRemoteSdp);

    return () => {
      emitPusher.current?.unbind(ACTIONS.SESSION_DESCRIPTION);
    };
  }, []);

  // Handle remove peer
  useEffect(() => {
    const handleRemovePeer = async ({
      peerId,
      userId,
    }: {
      peerId: string | undefined;
      userId: string | undefined;
    }) => {
      if (peerId) {
        if (connections.current[peerId]) {
          connections.current[peerId].close();
        }

        delete connections.current[peerId];
        delete audioElements.current[peerId];
      }
      if (userId) {
        setClients((list: any) =>
          list.filter((client: any) => client.id !== userId)
        );
      }
    };

    pusher.current?.bind("pusher:member_removed", (member: any) => {
      handleRemovePeer({ peerId: undefined, userId: member.id });
    });
    pusher.current?.bind(ACTIONS.REMOVE_PEER, handleRemovePeer);
    return () => {
      pusher.current?.unbind(ACTIONS.REMOVE_PEER);
    };
  }, []);

  const provideRef = (instance: any, userId: string) => {
    audioElements.current[userId] = instance;
  };

  return { clients, provideRef };
};

// Returns a promise that resolves when the |transport.state| is |state|
// This should work for RTCSctpTransport, RTCDtlsTransport and RTCIceTransport.
async function waitForState(
  transport: RTCSctpTransport | RTCDtlsTransport | RTCIceTransport,
  state: RTCSctpTransportState | RTCDtlsTransportState | RTCIceTransportState
) {
  while (transport.state != state) {
    await waitUntilEvent(transport, "statechange");
  }
}

// Returns a promise that resolves when |pc.iceConnectionState| is 'connected'
// or 'completed'.
async function listenToIceConnected(pc: RTCPeerConnection) {
  await waitForIceStateChange(pc, ["connected", "completed"]);
}

// Returns a promise that resolves when |pc.iceConnectionState| is in one of the
// wanted states.
async function waitForIceStateChange(
  pc: RTCPeerConnection,
  wantedStates: RTCIceConnectionState[]
) {
  while (!wantedStates.includes(pc.iceConnectionState)) {
    await waitUntilEvent(pc, "iceconnectionstatechange");
  }
}

// Returns a promise that resolves when |pc.connectionState| is 'connected'.
async function listenToConnected(pc: RTCPeerConnection) {
  while (pc.connectionState != "connected") {
    await waitUntilEvent(pc, "connectionstatechange");
  }
}

// Returns a promise that resolves when |pc.connectionState| is in one of the
// wanted states.
async function waitForConnectionStateChange(
  pc: RTCPeerConnection,
  wantedStates: RTCPeerConnectionState[]
) {
  while (!wantedStates.includes(pc.connectionState)) {
    await waitUntilEvent(pc, "connectionstatechange");
  }
}

async function waitForIceGatheringState(
  pc: RTCPeerConnection,
  wantedStates: RTCIceGatheringState[]
) {
  while (!wantedStates.includes(pc.iceGatheringState)) {
    await waitUntilEvent(pc, "icegatheringstatechange");
  }
}

function waitUntilEvent(obj: any, name: string) {
  return new Promise((r) => obj.addEventListener(name, r, { once: true }));
}
