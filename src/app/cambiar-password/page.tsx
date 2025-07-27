
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Listen for the password recovery event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // This event fires when the user is redirected back from the password reset link
        if (event === 'PASSWORD_RECOVERY') {
            // The user is now in a special state to update their password.
            // No need to do anything here, the form will handle the update.
        }
    });

    return () => {
        subscription?.unsubscribe();
    };
  }, [supabase]);


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
        toast({
            title: "Contraseña muy corta",
            description: "La contraseña debe tener al menos 6 caracteres.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "Error al cambiar la contraseña",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Also update the flag in the profiles table, just in case
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        await supabase
          .from('profiles')
          .update({ requires_password_change: false })
          .eq('id', user.id);
    }
    
    toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.",
    });

    await supabase.auth.signOut();
    router.push('/');
    setIsLoading(false);
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
