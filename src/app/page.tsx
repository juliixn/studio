
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { login } from '@/lib/authService';
import type { User } from '@/lib/definitions';

function saveUserToSession(user: User) {
    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    }
}


function ForgotPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // This functionality requires a backend with email sending capabilities.
    // We'll simulate the call and show an informational toast.
    setTimeout(() => {
        toast({
            title: "Función no disponible",
            description: "La recuperación de contraseña debe ser configurada en un servidor. Contacta a un administrador.",
            variant: "warning",
            duration: 7000,
        });
        setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-sm mx-auto z-10 shadow-xl animate-fade-in-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
        <CardDescription>Ingresa tu correo para recibir un enlace de recuperación.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Usuario (Email)</Label>
            <Input id="reset-email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Correo"}
          </Button>
          <Button variant="link" className="w-full" onClick={onBackToLogin}>
            Volver a Inicio de Sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


function LoginForm({ onForgotPasswordClick }: { onForgotPasswordClick: () => void}) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    
    if (!result.success || !result.user) {
      toast({
        title: "Error de inicio de sesión",
        description: result.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Store user profile in sessionStorage
    saveUserToSession(result.user);
    
    toast({
      title: "Inicio de Sesión Exitoso",
      description: "Redirigiendo a tu panel...",
    });

    switch (result.user.role) {
        case 'Administrador':
            router.push('/admin');
            break;
        case 'Adm. Condo':
            // If Adm. Condo has more than one condo, redirect to selection, otherwise to dashboard
            if (result.user.condominioIds && result.user.condominioIds.length > 1) {
                router.push('/admin/seleccionar-condominio');
            } else {
                router.push('/admin');
            }
            break;
        case 'Guardia':
            router.push('/guardia/iniciar-turno');
            break;
        case 'Propietario':
        case 'Renta':
            router.push('/dashboard');
            break;
        default:
            router.push('/');
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto z-10 shadow-xl animate-fade-in-up">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/logoo.png" alt="Logo Glomar" width={80} height={80} />
        </div>
        <CardTitle className="text-2xl font-bold font-headline">Glomar Condominios</CardTitle>
        <CardDescription>Inicia sesión para acceder a tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Usuario (Email)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Ingrese su email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
           <div className="text-right">
              <Button type="button" variant="link" className="p-0 h-auto text-xs" onClick={onForgotPasswordClick}>
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RootPage() {
    const [view, setView] = useState<'login' | 'forgotPassword'>('login');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
            {view === 'login' && (
                <LoginForm onForgotPasswordClick={() => setView('forgotPassword')} />
            )}
            {view === 'forgotPassword' && (
                <ForgotPasswordForm onBackToLogin={() => setView('login')} />
            )}
        </div>
    );
}
