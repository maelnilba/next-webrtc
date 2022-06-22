import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const Index: NextPage = () => {
  const router = useRouter();
  return (
    <div className="flex h-screen w-screen  flex-col items-center justify-center bg-gray-800">
      <Head>
        <title>Next WebRTC</title>
      </Head>
      <div className="flex flex-grow  items-end ">
        <form
          className="flex max-w-md flex-col justify-end "
          onSubmit={(e) => {
            e.preventDefault();
            const value = (e.currentTarget.elements.item(0) as HTMLInputElement)
              ?.value;
            if (value) {
              router.push(`/r/${value.replaceAll("/", "")}`);
            }
          }}
        >
          <input
            name="room_input"
            className="rounded-xl bg-gray-700 p-4"
            placeholder="Entrer a room name"
          />
          {router.query["invalid"] && (
            <label htmlFor="room_input" className="mt-2">
              Room names should only include lower and uppercase letters,
              numbers and the following punctuation _ - = @ , . ;
            </label>
          )}
        </form>
      </div>
      <div className="flex flex-1"></div>

      <div className="mb-2 text-lg font-bold hover:cursor-pointer hover:underline ">
        <Link href={"https://github.com/maelnilba/next-webrtc"} passHref>
          <a target="_blank">Github</a>
        </Link>
      </div>
    </div>
  );
};

export default Index;
