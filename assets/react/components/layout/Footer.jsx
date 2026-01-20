import React from 'react';
import logo from '@/../images/logo.png';
import { Github, HelpCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import SupportTicketModal from '@/components/common/SupportTicketModal';
import { Button } from '@/components/ui/button';

export default function Footer({ locale = 'en', user = null }) {
    const currentYear = new Date().getFullYear();
    const isLoggedIn = !!user;

    return (
        <footer className="border-t bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Left - Branding */}
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                            <img src={logo} alt="Inventorio Logo" className="h-6 w-6" />
                            <span className="font-semibold text-sm">Inventorio</span>
                        </a>
                        <span className="text-sm text-muted-foreground hidden md:inline">
                            © {currentYear}
                        </span>
                    </div>

                    {/* Center - Links */}
                    <nav className="flex items-center gap-4 text-sm">
                        <a
                            href="/privacy"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('footer.privacy', 'Privacy')}
                        </a>
                        <span className="text-muted-foreground/30">•</span>
                        <a
                            href="/terms"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('footer.terms', 'Terms')}
                        </a>
                        <span className="text-muted-foreground/30">•</span>
                        <a
                            href="https://github.com/taut0logy/inventorio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                        >
                            <Github className="h-4 w-4" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                    </nav>

                    {/* Right - Support */}
                    <div className="flex items-center gap-2">
                        {isLoggedIn ? (
                            <SupportTicketModal
                                trigger={
                                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                        <HelpCircle className="h-4 w-4" />
                                        {t('footer.support', 'Support')}
                                    </Button>
                                }
                            />
                        ) : (
                            <a
                                href="mailto:support@inventorio.app"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                            >
                                <HelpCircle className="h-4 w-4" />
                                {t('footer.support', 'Support')}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}

