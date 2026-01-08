import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, Upload } from 'lucide-react';

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
    const [isLoading, setIsLoading] = useState(false);

    const handleThemeChange = (value) => {
        setCurrentTheme(value);
        document.documentElement.classList.toggle('dark', value === 'dark');
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
    };
    
    // Check if we have errors to decide initial tab, but props override
    const initialTab = Object.keys(passwordErrors).length > 0 ? 'password' : activeTab;
    
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <Tabs defaultValue={initialTab} className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general" className="gap-2">
                        <User className="h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="password" className="gap-2" disabled={!hasPassword}>
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Details</CardTitle>
                            <CardDescription>
                                Manage your public profile and preferences.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {profileErrors.global && (
                                <Alert variant="destructive">
                                    <AlertDescription>{profileErrors.global}</AlertDescription>
                                </Alert>
                            )}
                            
                            <form id="profile-form" method="post" action={updateProfilePath} onSubmit={() => setIsLoading(true)}>
                                <input type="hidden" name="profile_form[_token]" value={csrfToken} />
                                
                                <div className="space-y-6">
                                    {/* Avatar Section - Placeholder for now */}
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <Button type="button" variant="outline" size="sm" className="gap-2">
                                                <Upload className="h-4 w-4" />
                                                Change Avatar
                                            </Button>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                JPG, GIF or PNG. Max 1MB.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input 
                                                id="name" 
                                                name="profile_form[name]"
                                                defaultValue={user.name} 
                                                className={profileErrors.name ? 'border-destructive' : ''}
                                            />
                                            {profileErrors.name && <p className="text-sm text-destructive">{profileErrors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input 
                                                id="email" 
                                                value={user.email} 
                                                disabled 
                                                className="bg-muted"
                                            />
                                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="theme">Theme</Label>
                                            <Select 
                                                name="profile_form[theme]" 
                                                value={currentTheme} 
                                                onValueChange={handleThemeChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">Light</SelectItem>
                                                    <SelectItem value="dark">Dark</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="locale">Language</Label>
                                            <Select name="profile_form[locale]" defaultValue={user.locale}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select language" />
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
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure.
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
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input 
                                            id="currentPassword" 
                                            name="change_password_form[currentPassword]"
                                            type="password"
                                            className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                                        />
                                        {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input 
                                            id="newPassword" 
                                            name="change_password_form[newPassword][first]"
                                            type="password"
                                            className={passwordErrors.newPassword ? 'border-destructive' : ''}
                                        />
                                        {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                        <CardFooter className="justify-end border-t pt-6">
                            <Button type="submit" form="password-form" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
