import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Tag, Folder } from 'lucide-react';
import { t } from '@/lib/i18n';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminCategoriesTab from './admin/AdminCategoriesTab';
import AdminTagsTab from './admin/AdminTagsTab';

export default function AdminPage({ currentUser }) {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.title', 'Admin Panel')}</h1>
                    <p className="text-muted-foreground">
                        {t('admin.description', 'Manage system resources')}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" />
                        {t('admin.tab.users', 'Users')}
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <Folder className="h-4 w-4" />
                        {t('admin.tab.categories', 'Categories')}
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="gap-2">
                        <Tag className="h-4 w-4" />
                        {t('admin.tab.tags', 'Tags')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <AdminUsersTab currentUser={currentUser} />
                </TabsContent>

                <TabsContent value="categories">
                     <AdminCategoriesTab />
                </TabsContent>

                <TabsContent value="tags">
                    <AdminTagsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
