import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

import { t } from '@/lib/i18n';

export default function ForgotPasswordPage({ loginPath, csrfToken }) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        // We let the form submit naturally to the backend controller
        setIsLoading(true);
        if (!email) {
            e.preventDefault();
            setError(t('val.email_enter', 'Please enter your email address.'));
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{t('reset.forgot.title', 'Reset password')}</CardTitle>
                    <CardDescription>
                        {t('reset.forgot.desc', "Enter your email address and we'll send you a link to reset your password.")}
                    </CardDescription>
                </CardHeader>
                <form method="post" onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.email', 'Email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('reset.forgot.btn', 'Send Reset Link')}
                        </Button>
                        <Button variant="link" className="px-0 font-normal" asChild>
                            <a href={loginPath} className="flex items-center text-muted-foreground hover:text-primary">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('reset.forgot.back', 'Back to login')}
                            </a>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
