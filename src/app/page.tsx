import { Suspense } from "react";
import ChannelsClient from "@/components/ChannelsClient";

export default function Home() {
  return (
    <div>
      <Suspense>
        <ChannelsClient />
      </Suspense>
    </div>
  );
}
