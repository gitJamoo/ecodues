import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  );
}
