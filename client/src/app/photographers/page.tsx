import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Find Photographers</h1>
          <p className="text-xl text-muted-foreground">
            Browse our network of professional photographers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Placeholder photographer cards */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Photographer {i}</CardTitle>
                <CardDescription>Professional photographer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specializing in weddings, portraits, and events.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
