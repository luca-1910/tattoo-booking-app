export default function StatusPage({ params }: { params: { token: string } }) {
  return (
    <main>
      <h1>Booking Status</h1>
      <p>Token: {params.token}</p>
    </main>
  );
}
