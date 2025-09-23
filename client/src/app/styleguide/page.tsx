'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

export default function StyleGuide() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Design System Style Guide</h1>

      {/* Buttons Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Button</CardTitle>
              <CardDescription>Primary action button</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Default</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary Button</CardTitle>
              <CardDescription>Secondary action</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary">Secondary</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outline Button</CardTitle>
              <CardDescription>Outlined variant</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Outline</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inputs Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
              <CardDescription>Standard text input field</CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder="Enter text..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Input</CardTitle>
              <CardDescription>Input with validation error</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter text..."
                error="This field is required"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Colors Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-brand-dark text-white">
            <CardHeader>
              <CardTitle>Brand Dark</CardTitle>
              <CardDescription>#0F1C5A</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-brand-light text-white">
            <CardHeader>
              <CardTitle>Brand Light</CardTitle>
              <CardDescription>#3B59FF</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-primary text-white">
            <CardHeader>
              <CardTitle>Primary</CardTitle>
              <CardDescription>#6366F1</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-secondary text-white">
            <CardHeader>
              <CardTitle>Secondary</CardTitle>
              <CardDescription>#0ea5e9</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
