import ChannelInput from "@/components/ChannelInput";
import ChannelList from "@/components/ChannelList";

export default function ChannelsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Channels</h1>
      <ChannelInput />
      <ChannelList />
    </div>
  );
}
