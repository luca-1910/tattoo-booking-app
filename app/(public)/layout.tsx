import PublicNav from "@/components/PublicNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      <div style={{ paddingTop: 56 }}>{children}</div>
    </>
  );
}
