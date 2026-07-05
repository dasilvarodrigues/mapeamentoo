import { LoginForm } from "@/components/LoginForm";
import { BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-600" />
          <h1 className="text-xl font-bold">Cassol Mapeamento</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Faça login para acessar o sistema
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
