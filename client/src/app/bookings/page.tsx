import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">My Bookings</h1>
          <p className="text-xl text-muted-foreground">
            Manage your photography bookings
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Placeholder booking cards */}
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Booking #{i}</CardTitle>
                <CardDescription>Photography session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Status: Pending
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
