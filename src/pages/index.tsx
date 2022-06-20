import type { NextPage } from "next";

const Index: NextPage = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <div className="flex w-screen flex-row justify-around ">
        <video
          className=" m-12 w-6/12 border border-stone-300 bg-blue-400"
          autoPlay
          playsInline
        ></video>
        <video
          className=" m-12 w-6/12 border border-stone-300  bg-blue-400"
          autoPlay
          playsInline
        ></video>
      </div>
      <div className="flex w-full flex-col space-y-2  px-4">
        <button className="rounded-xl bg-blue-200 p-2 text-2xl text-black">
          Create offer
        </button>
        <textarea></textarea>
        <button className="rounded-xl bg-blue-200 p-2 text-2xl text-black">
          Create answer
        </button>
        <textarea></textarea>
        <button className="rounded-xl bg-blue-200 p-2 text-2xl text-black">
          add answer
        </button>
      </div>
    </div>
  );
};

export default Index;
