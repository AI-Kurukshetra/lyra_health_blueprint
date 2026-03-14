import type { Metadata } from "next";
import { AppNav } from "@/components/nav/app-nav";
import { getAuthSession } from "@/lib/auth/session";
import { AppProviders } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyra Health Platform",
  description: "Enterprise mental wellness platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          <AppNav role={session?.profile?.role} email={session?.email} name={session?.profile?.full_name} />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
