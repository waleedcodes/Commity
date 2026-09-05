import Link from 'next/link';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center p-8">
        <CardContent className="space-y-6">
          <div className="text-6xl font-extrabold text-blue-600">404</div>
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">View Leaderboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
