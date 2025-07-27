
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

// This is a placeholder page. In a real app with Prisma, you'd need a robust
// password reset flow with secure tokens, which is beyond the scope of this
// client-side simulation.

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
        toast({
            title: "Contraseña muy corta",
            description: "La contraseña debe tener al menos 6 caracteres.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    // In a real app, you would have a token from the URL to verify the user
    // and then make a server call to update the password in Prisma.
    // For this simulation, we'll just show a success message and redirect.
    
    setTimeout(() => {
        toast({
            title: "Funcionalidad no implementada",
            description: "La recuperación de contraseña requiere una configuración de servidor segura.",
        });
        router.push('/');
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-sm mx-auto z-10 shadow-xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logoo.png" alt="Logo Glomar" width={80} height={80} />
          </div>
          <CardTitle className="text-2xl font-bold">Cambiar Contraseña</CardTitle>
          <CardDescription>Establece tu nueva contraseña para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="••••••••"
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••"
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : "Establecer Nueva Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
