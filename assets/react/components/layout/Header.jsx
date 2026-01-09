import React, { useState } from 'react';
import logo from '@/../images/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
    Package, 
    Search, 
    Menu, 
    User, 
    Settings, 
    LogOut, 
    Moon, 
    Sun, 
    Globe,
    LayoutDashboard,
    Shield
} from 'lucide-react';

import { t } from '@/lib/i18n';

export default function Header({ 
    user, 
    locale = 'en',
    theme = 'light',
    homePath = '/',
    loginPath = '/login',
    registerPath = '/register',
    logoutPath = '/logout',
    profilePath = '/profile',
    adminPath = '/admin',
    myInventoriesPath = '/my-inventories',
    searchPath = '/search'
}) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(theme);
    const [currentLocale, setCurrentLocale] = useState(locale);

    const isLoggedIn = !!user;
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const toggleTheme = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        // TODO: Save to user preferences via API
    };

    const toggleLocale = () => {
        const newLocale = currentLocale === 'en' ? 'bn' : 'en';
        // Redirect to the backend controller to update preference and session
        window.location.href = `/switch-locale/${newLocale}`;
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const NavLinks = ({ className = '', onClick = () => {} }) => (
        <nav className={className}>
            <a 
                href={homePath} 
                onClick={onClick}
                className="transition-colors hover:text-foreground text-foreground/60"
            >
                {t('nav.home', 'Home')}
            </a>
            {isLoggedIn && (
                <a 
                    href={myInventoriesPath} 
                    onClick={onClick}
                    className="transition-colors hover:text-foreground text-foreground/60"
                >
                    {t('nav.inventory', 'My Inventories')}
                </a>
            )}
            {isAdmin && (
                <a 
                    href={adminPath} 
                    onClick={onClick}
                    className="transition-colors hover:text-foreground text-foreground/60"
                >
                    {t('nav.admin', 'Admin')}
                </a>
            )}
        </nav>
    );

    return (
        <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
                {/* Logo */}
                <a href={homePath} className="flex items-center space-x-2 mr-4">
                    <img src={logo} alt="Inventorio Logo" className="h-8 w-8" />
                    <span className="font-bold hidden sm:inline-block">Inventorio</span>
                </a>

                {/* Desktop Navigation */}
                <NavLinks className="hidden md:flex items-center space-x-6 text-sm font-medium" />

                {/* Right Side */}
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {/* Global Search */}
                    <GlobalSearch className="hidden lg:block" />

                    {/* Mobile Search Toggle */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Theme Toggle */}
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {currentTheme === 'light' ? (
                            <Moon className="h-5 w-5" />
                        ) : (
                            <Sun className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Language Toggle */}
                    <Button variant="ghost" size="sm" onClick={toggleLocale} className="gap-1.5">
                        <Globe className="h-4 w-4" />
                        <span className="text-xs font-medium">{currentLocale === 'en' ? 'EN' : 'BN'}</span>
                    </Button>

                    {/* User Menu */}
                    {isLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={myInventoriesPath} className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        {t('nav.inventory', 'My Inventories')}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={profilePath} className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        {t('nav.profile', 'Profile')}
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={profilePath} className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        {t('nav.settings', 'Settings')}
                                    </a>
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <a href={adminPath} className="cursor-pointer">
                                                <Shield className="mr-2 h-4 w-4" />
                                                {t('nav.admin', 'Admin Panel')}
                                            </a>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={logoutPath} className="cursor-pointer text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        {t('nav.logout', 'Log out')}
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden sm:flex items-center space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                                <a href={loginPath}>{t('nav.login', 'Login')}</a>
                            </Button>
                            <Button size="sm" asChild>
                                <a href={registerPath}>{t('nav.register', 'Register')}</a>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80">
                            <div className="flex flex-col space-y-4 mt-6">
                                {/* Mobile Search */}
                                <form action={searchPath} method="get" className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="search" 
                                        name="q"
                                        placeholder={t('nav.search', 'Search...')} 
                                        className="pl-9"
                                    />
                                </form>

                                {/* Mobile Nav Links */}
                                <NavLinks className="flex flex-col space-y-3 text-lg font-medium" />

                                {!isLoggedIn && (
                                    <div className="flex flex-col space-y-2 pt-4 border-t">
                                        <Button asChild>
                                            <a href={loginPath}>{t('nav.login', 'Login')}</a>
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <a href={registerPath}>{t('nav.register', 'Register')}</a>
                                        </Button>
                                    </div>
                                )}

                                {/* Settings */}
                                <div className="pt-4 border-t space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="mobile-theme" className="flex items-center gap-2">
                                            {currentTheme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                            {t('nav.dark_mode', 'Dark Mode')}
                                        </Label>
                                        <Switch 
                                            id="mobile-theme"
                                            checked={currentTheme === 'dark'}
                                            onCheckedChange={toggleTheme}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {t('nav.language', 'Language')}
                                        </Label>
                                        <Button variant="outline" size="sm" onClick={toggleLocale}>
                                            {currentLocale === 'en' ? 'বাংলা' : 'English'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Mobile Search Bar (expandable) */}
            {isSearchOpen && (
                <div className="lg:hidden border-t p-2">
                    <form action={searchPath} method="get" className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            name="q"
                            placeholder={t('nav.search', 'Search inventories...')} 
                            className="pl-9"
                            autoFocus
                        />
                    </form>
                </div>
            )}
        </header>
    );
}
