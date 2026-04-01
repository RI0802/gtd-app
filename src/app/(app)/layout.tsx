import { SessionProvider } from "next-auth/react";

import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="md:ml-64">
          <main className="pb-20 md:pb-0">{children}</main>
        </div>
        <BottomNav />
      </div>
    </SessionProvider>
  );
}
