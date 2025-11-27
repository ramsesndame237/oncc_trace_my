"use client";

import { LoadingLoader } from "./loading-loader";

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({ message }: LoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <LoadingLoader />
        </div>
        {message && <p className="text-primary">{message}</p>}
      </div>
    </div>
  );
}
