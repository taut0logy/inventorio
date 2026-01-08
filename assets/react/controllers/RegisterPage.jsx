import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

import { t } from '@/lib/i18n';

export default function RegisterPage({ csrfToken, registerPath, loginPath, googlePath, facebookPath, errors: serverErrors = {} }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [errors, setErrors] = useState(serverErrors);
    const [touched, setTouched] = useState({});

    // Password strength calculation
    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[a-z]/.test(password)) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 25;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    
    const passwordRequirements = [
        { label: t('pw.chars', 'At least 8 characters'), met: formData.password.length >= 8 },
        { label: t('pw.lower', 'One lowercase letter'), met: /[a-z]/.test(formData.password) },
        { label: t('pw.upper', 'One uppercase letter'), met: /[A-Z]/.test(formData.password) },
        { label: t('pw.number', 'One number'), met: /\d/.test(formData.password) },
    ];

    const validateField = (field, value) => {
        switch (field) {
            case 'name':
                if (!value) return t('val.name_required', 'Name is required');
                if (value.length < 2) return t('val.name_min', 'Name must be at least 2 characters');
                return null;
            case 'email':
                if (!value) return t('val.email_required', 'Email is required');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('val.email_invalid', 'Please enter a valid email');
                return null;
            case 'password':
                if (!value) return t('val.password_required', 'Password is required');
                if (value.length < 8) return t('val.password_min', 'Password must be at least 8 characters');
                if (!/[a-z]/.test(value)) return t('val.password_lower', 'Password must contain a lowercase letter');
                if (!/[A-Z]/.test(value)) return t('val.password_upper', 'Password must contain an uppercase letter');
                if (!/\d/.test(value)) return t('val.password_number', 'Password must contain a number');
                return null;
            case 'confirmPassword':
                if (!value) return t('val.confirm_required', 'Please confirm your password');
                if (value !== formData.password) return t('val.password_mismatch', 'Passwords do not match');
                return null;
            case 'agreeTerms':
                if (!value) return t('val.terms_required', 'You must agree to the terms');
                return null;
            default:
                return null;
        }
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }
        setIsLoading(true);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-8rem)] flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{t('auth.register.title', 'Create an account')}</CardTitle>
                    <CardDescription>{t('auth.start_desc', 'Enter your details to get started')}</CardDescription>
                </CardHeader>
                
                <CardContent>
                    {errors.global && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{errors.global}</AlertDescription>
                        </Alert>
                    )}
                    <form method="post" action={registerPath} onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="registration_form[_token]" value={csrfToken} />
                        
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('auth.full_name', 'Full Name')}</Label>
                            <Input
                                id="name"
                                name="registration_form[name]"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                className={errors.name ? 'border-destructive' : ''}
                                autoComplete="name"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.email', 'Email')}</Label>
                            <Input
                                id="email"
                                name="registration_form[email]"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                                className={errors.email ? 'border-destructive' : ''}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.password', 'Password')}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="registration_form[plainPassword][first]"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="space-y-2">
                                    <Progress value={passwordStrength} className="h-2" />
                                    <div className="grid grid-cols-2 gap-1">
                                        {passwordRequirements.map((req, i) => (
                                            <div key={i} className="flex items-center gap-1 text-xs">
                                                {req.met ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <X className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {errors.password && touched.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('auth.confirm_password', 'Confirm Password')}</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="registration_form[plainPassword][second]"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="agreeTerms"
                                name="registration_form[agreeTerms]"
                                checked={formData.agreeTerms}
                                onCheckedChange={(checked) => handleInputChange('agreeTerms', checked)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="agreeTerms" className="text-sm font-normal leading-tight cursor-pointer">
                                {t('auth.i_agree', 'I agree to the')}{' '}
                                <a href="#" className="text-primary hover:underline">{t('auth.terms', 'Terms of Service')}</a>
                                {' '}and{' '}
                                <a href="#" className="text-primary hover:underline">{t('auth.privacy', 'Privacy Policy')}</a>
                            </Label>
                        </div>
                        {errors.agreeTerms && (
                            <p className="text-sm text-destructive">{errors.agreeTerms}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('auth.register.submit', 'Create Account')}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs uppercase text-muted-foreground">
                            {t('auth.or_continue', 'Or continue with')}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" asChild>
                            <a href={googlePath} className="w-full">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={facebookPath} className="w-full">
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook
                            </a>
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        {t('auth.already_account', 'Already have an account?')}{' '}
                        <a href={loginPath} className="text-primary hover:underline font-medium">
                            {t('auth.sign_in_link', 'Sign in')}
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
