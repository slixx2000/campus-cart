import SlideTabs from "@/components/slide-tabs";

export default function DemoPage() {
  return (
    <div className="grid min-h-screen place-content-center bg-background-light px-4 dark:bg-background-dark">
      <SlideTabs unreadMessages={3} />
    </div>
  );
}
