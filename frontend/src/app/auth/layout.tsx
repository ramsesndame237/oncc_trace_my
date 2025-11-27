import { AuthGuard } from "@/features/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
        {children}
      </div>
    </AuthGuard>
  );
}
