import React from 'react';
import logo from '@/../images/logo.png';
import { Separator } from '@/components/ui/separator';
import { Github, Twitter, Mail, Instagram } from 'lucide-react';

export default function Footer({ locale = 'en' }) {
    const currentYear = new Date().getFullYear();

    const translations = {
        en: {
            tagline: 'Smart inventory management for everyone.',
            product: 'Product',
            features: 'Features',
            pricing: 'Pricing',
            docs: 'Documentation',
            company: 'Company',
            about: 'About',
            blog: 'Blog',
            careers: 'Careers',
            legal: 'Legal',
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            rights: 'All rights reserved.',
            builtWith: 'Built with Symfony + React + shadcn/ui',
            contact: 'Contact'
        },
        bn: {
            tagline: 'সবার জন্য স্মার্ট ইনভেন্টরি ম্যানেজমেন্ট।',
            product: 'পণ্য',
            features: 'বৈশিষ্ট্য',
            pricing: 'মূল্য',
            docs: 'ডকুমেন্টেশন',
            company: 'কোম্পানি',
            about: 'সম্পর্কে',
            blog: 'ব্লগ',
            careers: 'চাকরি',
            legal: 'আইনি',
            privacy: 'গোপনীয়তা নীতি',
            terms: 'পরিষেবার শর্তাবলী',
            rights: 'সর্বস্বত্ব সংরক্ষিত।',
            builtWith: 'Symfony + React + shadcn/ui দিয়ে তৈরি',
            contact: 'যোগাযোগ'
        }
    };

    const t = translations[locale] || translations.en;

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
                            {t.tagline}
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
                        <h3 className="font-semibold mb-4">{t.product}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.features}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.pricing}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.docs}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold mb-4">{t.company}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.about}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.blog}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.careers}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold mb-4">{t.legal}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.privacy}
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    {t.terms}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© {currentYear} Inventorio. {t.rights}</p>
                    <p>{t.builtWith}</p>
                </div>
            </div>
        </footer>
    );
}
