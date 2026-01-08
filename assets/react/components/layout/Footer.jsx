import React from 'react';
import logo from '@/../images/logo.png';
import { Separator } from '@/components/ui/separator';
import { Github, Twitter, Mail } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function Footer({ locale = 'en' }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                             <img src={logo} alt="Inventorio Logo" className="h-8 w-8" />
                            <span className="font-bold">Inventorio</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t('footer.tagline', 'Smart inventory management for everyone.')}
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('footer.product', 'Product')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.features', 'Features')}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.pricing', 'Pricing')}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.docs', 'Documentation')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('footer.company', 'Company')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.about', 'About')}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.blog', 'Blog')}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.careers', 'Careers')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold mb-4">{t('footer.legal', 'Legal')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.privacy', 'Privacy Policy')}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t('footer.terms', 'Terms of Service')}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© {currentYear} Inventorio. {t('footer.rights', 'All rights reserved.')}</p>
                    <p>{t('footer.built_with', 'Built with Symfony + React + shadcn/ui')}</p>
                </div>
            </div>
        </footer>
    );
}
