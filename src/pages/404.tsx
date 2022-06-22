import { NextPage } from "next";
import { Head } from "next/document";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Index: NextPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  }, []);
  return (
    <div className="flex h-screen w-screen  flex-col items-center justify-center bg-gray-800"></div>
  );
};

export default Index;
