import type { Metadata } from "next";
import NoConnectionState from "@/components/NoConnectionState";

export const metadata: Metadata = {
  title: "No Connection - CampusCart",
  description: "Connection lost. Reconnect to keep using CampusCart.",
};

export default function NoConnectionPage() {
  return <NoConnectionState />;
}
