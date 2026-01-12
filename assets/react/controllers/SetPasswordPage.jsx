import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Lock, Check, X, Shield } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function SetPasswordPage({ user, errors = {}, csrfToken }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Password requirements
    const requirements = [
        { key: 'length', label: t('pw.chars', 'At least 8 characters'), test: (p) => p.length >= 8 },
        { key: 'lower', label: t('pw.lower', 'One lowercase letter'), test: (p) => /[a-z]/.test(p) },
        { key: 'upper', label: t('pw.upper', 'One uppercase letter'), test: (p) => /[A-Z]/.test(p) },
        { key: 'number', label: t('pw.number', 'One number'), test: (p) => /[0-9]/.test(p) },
    ];

    const allRequirementsMet = requirements.every(r => r.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative inline-block">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                                <Shield className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                    <CardTitle className="text-2xl">{t('set_password.title', 'Secure Your Account')}</CardTitle>
                    <CardDescription>
                        {t('set_password.description', 'Please set a password to secure your account. You\'ll be able to use it along with your email to sign in.')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {errors.global && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{errors.global}</AlertDescription>
                        </Alert>
                    )}
                    
                    <form method="post" action="/set-password/save" onSubmit={() => setIsLoading(true)}>
                        <input type="hidden" name="_csrf_token" value={csrfToken} />
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('password.new', 'New Password')}</Label>
                                <Input 
                                    id="password" 
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={errors.password ? 'border-destructive' : ''}
                                    autoFocus
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">{t('password.confirm', 'Confirm Password')}</Label>
                                <Input 
                                    id="confirm_password" 
                                    name="confirm_password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={errors.confirm_password ? 'border-destructive' : ''}
                                />
                                {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password}</p>}
                            </div>

                            {/* Password requirements */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium mb-2">{t('set_password.requirements', 'Password Requirements')}</p>
                                {requirements.map((req) => (
                                    <div key={req.key} className="flex items-center gap-2 text-sm">
                                        {req.test(password) ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className={req.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 text-sm pt-2 border-t mt-2">
                                    {passwordsMatch ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className={passwordsMatch ? 'text-green-600' : 'text-muted-foreground'}>
                                        {t('set_password.passwords_match', 'Passwords match')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full mt-6" 
                            disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Lock className="mr-2 h-4 w-4" />
                            {t('set_password.button', 'Set Password')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    {t('set_password.why', 'This helps keep your account secure and allows password login.')}
                </CardFooter>
            </Card>
        </div>
    );
}
