import { Suspense } from "react";
import GateForm from "@/app/components/GateForm";

export const metadata = {
  title: "你是谁呀？",
  description: "这是一个私人博客，输入密码后才能进入。",
};

export default function GatePage() {
  return (
    <Suspense fallback={null}>
      <GateForm />
    </Suspense>
  );
}
