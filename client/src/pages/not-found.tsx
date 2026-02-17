import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Did you get lost in the lobby? This page doesn't exist.
          </p>

          <Link href="/" className="mt-6 inline-block w-full text-center px-4 py-2 rounded bg-primary text-black font-bold hover:bg-primary/80 transition-colors">
            Return to Lobby
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
