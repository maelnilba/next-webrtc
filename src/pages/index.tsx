import type { NextPage } from "next";
import { useRouter } from "next/router";

const Index: NextPage = () => {
  const router = useRouter();
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-800">
      <form
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
          className="rounded-xl bg-gray-700 p-4"
          placeholder="Entrer a room name"
        />
      </form>
    </div>
  );
};

export default Index;
