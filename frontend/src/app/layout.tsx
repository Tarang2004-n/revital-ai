import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RE:VITAL AI | Counterfactual Recovery Intelligence & Adaptive Care",
  description: "Continuous-Time Trajectory Forecast, Adaptive Conformal Inference, and Counterfactual Recovery Fork Engine for Post-ICU Step-Down Care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-slate-100 antialiased selection:bg-cyan-clinical/30 selection:text-cyan-clinical">
        {children}
      </body>
    </html>
  );
}
