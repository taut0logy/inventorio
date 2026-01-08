import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    MoreHorizontal,
    Share2,
    Settings,
    MessageSquare,
    Activity,
    Search,
    Filter,
    ArrowLeft,
    Plus
} from 'lucide-react';
import { t } from '@/lib/i18n';
import CreateItemSheet from '@/components/inventory/CreateItemSheet';

export default function InventoryShowPage({
    inventory,
    currentUser,
    isCreator,
    items = []
}) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter items based on search
    const filteredItems = items.filter(item =>
        item.customId.toLowerCase().includes(searchQuery.toLowerCase())
        // TODO: Search other fields
    );

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Sticky Header */}
            <header className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <a href="/inventory/">
                                <ArrowLeft className="h-5 w-5" />
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                {/* We could use inventory.category.icon here */}
                                <span className="text-xl">📦</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold leading-none mb-1">
                                    {inventory.title}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 rounded-sm">
                                        {inventory.category.name}
                                    </Badge>
                                    <span>•</span>
                                    <span>{items.length} items</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isCreator && (
                            <CreateItemSheet inventoryId={inventory.id} />
                        )}
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <Tabs defaultValue="items" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="items" className="gap-2">
                            Box <Badge variant="secondary" className="ml-1 h-5 px-1.5">{items.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2">
                            <Activity className="h-4 w-4" /> Activity
                        </TabsTrigger>
                        <TabsTrigger value="discussion" className="gap-2">
                            <MessageSquare className="h-4 w-4" /> Discussion
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search items..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Custom String 1</TableHead>
                                        <TableHead>Custom Number 1</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium font-mono">{item.customId}</TableCell>
                                                <TableCell>{item.customString1Value || '-'}</TableCell>
                                                <TableCell>{item.customNumber1Value || '-'}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No items found. Add one to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-muted-foreground text-center">Activity log coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="discussion">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-muted-foreground text-center">Discussion board coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
