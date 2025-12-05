import type { Metadata } from "next";
import "./globals.css";
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import MainLayout from "@/components/Layout/MainLayout";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Web NAS",
  description: "Private Cloud Storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Providers>
          <ThemeRegistry>
            <MainLayout>
              {children}
            </MainLayout>
          </ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
