import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowRight } from 'lucide-react';

export default function CheckEmailPage({ loginPath, resetToken }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription className="text-base">
                        We have sent a password reset link to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-4">
                        If you don't receive the email within a few minutes, please check your spam folder.
                    </p>
                    <p>
                        The link will expire in 1 hour.
                    </p>
                    
                    {/* For demo purposes only - in production removing this */}
                    {/* <div className="mt-4 p-2 bg-muted rounded text-xs break-all">
                        Dev Token: {resetToken?.token}
                    </div> */}
                </CardContent>
                <CardFooter className="justify-center">
                    <Button asChild>
                        <a href={loginPath}>
                            Return to Login
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
