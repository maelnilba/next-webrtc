// import { useWebRTC } from "@hooks/broken-useWebRTC";

// import type { NextPage } from "next";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Message, usePusherEvents, User } from "@hooks/usePusher";
// import { useLocaleStream } from "@hooks/useLocaleStream";

// const Index: NextPage = () => {
//   const localeStream = useLocaleStream({
//     config: {
//       video: true,
//     },
//   });
//   const { members, me, fetchPusher } = usePusherEvents();

//   if (!me) {
//     return <div>loading authorization from pusher...</div>;
//   }
//   return (
//     <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
//       <div className="flex w-screen flex-row justify-around ">
//         {localeStream && <LocaleVideoRTC stream={localeStream} />}
//         {localeStream && (
//           <>
//             {members.map((member) => (
//               <RemoteVideoRTC
//                 member={member}
//                 me={me}
//                 localeStream={localeStream}
//                 key={member.id}
//                 fetcher={fetchPusher}
//                 // messages={messages.filter(
//                 //   (message) => message?.metadata?.user_id === member.id
//                 // )}
//               />
//             ))}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// const RemoteVideoRTC: React.FC<{
//   member: any;
//   me: User;
//   localeStream: MediaStream;
//   // messages: Message[];
//   fetcher: ({ payload, type }: { payload: string; type: any }) => Promise<void>;
// }> = ({ member, me, localeStream, fetcher }) => {
//   // const lastMessage = messages[messages.length - 1];
//   const renders = useRef(0);
//   console.log(`renders in remotevrtc:`, renders.current++);
//   const { messages } = usePusherEvents();
//   const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

//   const onCandidate = async (candidate: string) => {
//     await fetcher({
//       type: "candidate",
//       payload: candidate,
//     });
//   };
//   const {
//     peerConnection,
//     streamDisconnect,
//     remoteStream: peerRemoteStream,
//     createOffer,
//     createAnswer,

//     setOffer,
//     addAnswer,
//     setAnswer,
//     addCandidate,
//   } = useWebRTC({ onIceCandidate: onCandidate, localeStream });

//   useEffect(() => {
//     const listenPusher = async ({
//       data,
//       metadata,
//     }: {
//       data: any;
//       metadata?: any;
//     }) => {
//       if (metadata.user_id === me.id) return;
//       if (data.type === "candidate") {
//         addCandidate(JSON.parse(data.payload));
//       }
//       console.log("type:", data.type, data);
//       // create offer when member join then send back the offer
//       // also send candidate on ice candidate event => refer to onCandidate
//       // should check if connection also exist
//       if (data.type === "join" && peerConnection?.connectionState === "new") {
//         // if (offer) return;
//         console.log("I am sending the offer");
//         const _offer = await createOffer();
//         fetcher({
//           type: "offer",
//           payload: JSON.stringify(_offer),
//         });
//       }
//       // create answer when we go a offer type and send it back
//       if (data.type === "offer" && !peerConnection?.localDescription) {
//         setOffer(JSON.parse(data.payload));
//         const _answer = await createAnswer(JSON.parse(data.payload));
//         fetcher({
//           type: "answer",
//           payload: JSON.stringify(_answer),
//         });
//       }

//       // addanswer when we got a answer type
//       if (data.type === "answer" && !peerConnection?.localDescription) {
//         setAnswer(JSON.parse(data.payload));
//         addAnswer(JSON.parse(data.payload));
//         fetcher({ type: "accept", payload: "accept" });
//       }

//       // check if should work
//       if (data.type === "accept") {
//       }

//       if (data.type === "leave") {
//         streamDisconnect();
//       }
//     };
//     if (lastMessage) {
//       console.log("messages:", lastMessage.data.type, messages);
//       listenPusher(lastMessage);
//     }
//     // console.log("event-pusher:", data.type);
//     // console.log(localeStream, remoteStream);
//     // if message candidate add candidate peerConnection.addCandidate(candidate)
//   }, [lastMessage]);

//   // useEffectOnce(() => {
//   //   initLocaleStream();
//   // });

//   // return <div>{renders.current}</div>;
//   return <VideoRTC stream={peerRemoteStream} />;
// };
// const LocaleVideoRTC: React.FC<{ stream: MediaStream | undefined }> = ({
//   stream,
// }) => {
//   const streamRef = useRef<HTMLVideoElement>(null);
//   useEffect(() => {
//     if (!stream) return;
//     if (!streamRef.current) return;
//     streamRef.current.srcObject = stream;
//   }, [streamRef]);
//   // console.log("VideoRTC", stream);
//   if (!stream?.active) return null;
//   return (
//     <div className="w-auto">
//       <video
//         className="border border-stone-300 bg-blue-400"
//         ref={streamRef}
//         autoPlay
//         playsInline
//       ></video>
//     </div>
//   );
// };

// const VideoRTC: React.FC<{ stream: MediaStream | undefined }> = ({
//   stream,
// }) => {
//   const streamRef = useRef<HTMLVideoElement>(null);
//   useEffect(() => {
//     if (!stream) return;
//     if (!streamRef.current) return;
//     streamRef.current.srcObject = stream;
//   }, [streamRef]);
//   // console.log("VideoRTC", stream);
//   // if (!stream?.active) return null;
//   return (
//     <div className="w-auto">
//       <video
//         className="border border-stone-300 bg-blue-400"
//         ref={streamRef}
//         autoPlay
//         playsInline
//       ></video>
//     </div>
//   );
// };
const Index = () => <div></div>;
export default Index;
