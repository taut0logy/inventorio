import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock } from 'lucide-react';
import AvatarUpload from '@/components/profile/AvatarUpload';

import { t } from '@/lib/i18n';

export default function ProfilePage({ 
    user, 
    updateProfilePath, 
    changePasswordPath, 
    csrfToken, 
    passwordCsrfToken,
    profileErrors = {},
    passwordErrors = {},
    activeTab = 'general',
    hasPassword = true
}) {
    const [currentTheme, setCurrentTheme] = useState(user.theme);
    const [currentLocale, setCurrentLocale] = useState(user.locale);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
    const fileInputRef = useRef(null);

    const handleThemeChange = (value) => {
        setCurrentTheme(value);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
        document.cookie = `THEME=${value}; path=/; max-age=31536000; SameSite=Lax`;
    };
    
    // Check if we have errors to decide initial tab, but props override
    const initialTab = Object.keys(passwordErrors).length > 0 ? 'password' : activeTab;
    
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">{t('profile.title', 'Account Settings')}</h1>

            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('profile.tab.general', 'General')}
                    </TabsTrigger>
                    <TabsTrigger value="password" className="gap-2" disabled={!hasPassword}>
                        <Lock className="h-4 w-4" />
                        {t('profile.tab.security', 'Security')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.details.title', 'Profile Details')}</CardTitle>
                            <CardDescription>
                                {t('profile.details.description', 'Manage your public profile and preferences.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {profileErrors.global && (
                                <Alert variant="destructive">
                                    <AlertDescription>{profileErrors.global}</AlertDescription>
                                </Alert>
                            )}
                            
                            <form id="profile-form" method="post" action={updateProfilePath} encType="multipart/form-data" onSubmit={() => setIsLoading(true)}>
                                <input type="hidden" name="profile_form[_token]" value={csrfToken} />
                                
                                <div className="space-y-6">
                                    {/* Avatar Section */}
                                    <AvatarUpload 
                                        currentAvatarUrl={user.avatarUrl}
                                        userName={user.name}
                                        name="profile_form[avatar]"
                                        onPreviewChange={(preview) => setAvatarPreview(preview)}
                                    />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">{t('profile.field.name', 'Full Name')}</Label>
                                            <Input 
                                                id="name" 
                                                name="profile_form[name]"
                                                defaultValue={user.name} 
                                                className={profileErrors.name ? 'border-destructive' : ''}
                                            />
                                            {profileErrors.name && <p className="text-sm text-destructive">{profileErrors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">{t('profile.field.email', 'Email')}</Label>
                                            <Input 
                                                id="email" 
                                                value={user.email} 
                                                disabled 
                                                className="bg-muted"
                                            />
                                            <p className="text-xs text-muted-foreground">{t('profile.field.email_help', 'Email cannot be changed.')}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="theme">{t('profile.field.theme', 'Theme')}</Label>
                                            <input type="hidden" name="profile_form[theme]" value={currentTheme} />
                                            <Select 
                                                value={currentTheme} 
                                                onValueChange={handleThemeChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('profile.field.theme', 'Select theme')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">Light</SelectItem>
                                                    <SelectItem value="dark">Dark</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="locale">{t('profile.field.language', 'Language')}</Label>
                                            <input type="hidden" name="profile_form[locale]" value={currentLocale} />
                                            <Select 
                                                value={currentLocale} 
                                                onValueChange={setCurrentLocale}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('profile.field.language', 'Select language')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English (US)</SelectItem>
                                                    <SelectItem value="bn">Bengali</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-6">
                            <Button type="submit" form="profile-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('action.save', 'Save Changes')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('password.title', 'Change Password')}</CardTitle>
                            <CardDescription>
                                {t('password.description', 'Update your password to keep your account secure.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {passwordErrors.global && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{passwordErrors.global}</AlertDescription>
                                </Alert>
                            )}
                            
                            <form id="password-form" method="post" action={changePasswordPath} onSubmit={() => setIsLoading(true)}>
                                <input type="hidden" name="change_password_form[_token]" value={passwordCsrfToken} />
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">{t('password.current', 'Current Password')}</Label>
                                        <Input 
                                            id="currentPassword" 
                                            name="change_password_form[currentPassword]"
                                            type="password"
                                            className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                                        />
                                        {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">{t('password.new', 'New Password')}</Label>
                                        <Input 
                                            id="newPassword" 
                                            name="change_password_form[newPassword][first]"
                                            type="password"
                                            className={passwordErrors.newPassword ? 'border-destructive' : ''}
                                        />
                                        {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">{t('password.confirm', 'Confirm New Password')}</Label>
                                        <Input 
                                            id="confirmPassword" 
                                            name="change_password_form[newPassword][second]"
                                            type="password"
                                            className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                                        />
                                        {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-4">
                            <Button type="submit" form="password-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('action.update', 'Update Password')}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
