import type { Metadata } from "next";
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
    <html lang="en">
      <body>
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
