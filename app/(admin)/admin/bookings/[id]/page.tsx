export default function BookingDetailPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h1>Booking Detail</h1>
      <p>ID: {params.id}</p>
    </main>
  );
}
