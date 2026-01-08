import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function DemoPage({ userName, pageTitle }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sliderValue, setSliderValue] = useState([50]);
  const [selectedTheme, setSelectedTheme] = useState('light');

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
  };

  const inventoryItems = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', quantity: 15, status: 'In Stock' },
    { id: 2, name: 'Wireless Mouse', category: 'Accessories', quantity: 42, status: 'In Stock' },
    { id: 3, name: 'USB-C Hub', category: 'Accessories', quantity: 3, status: 'Low Stock' },
    { id: 4, name: 'Monitor 27"', category: 'Electronics', quantity: 0, status: 'Out of Stock' },
  ];

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground">Welcome back, {userName}!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Buttons Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Buttons & Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <Separator className="my-6" />

        {/* Form Elements Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Form Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Priority Level: {sliderValue}%</Label>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* Table Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Inventory Table</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant={
                              item.status === 'In Stock'
                                ? 'default'
                                : item.status === 'Low Stock'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current quantity: {item.quantity}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator className="my-6" />

        {/* Accordion Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">FAQ (Accordion)</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is this inventory system?</AccordionTrigger>
              <AccordionContent>
                This is a modern inventory management system built with Symfony, React, and shadcn/ui components.
                It provides a beautiful and functional interface for managing your inventory.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How do I add new items?</AccordionTrigger>
              <AccordionContent>
                You can add new items by navigating to the "Add Item" page and filling out the form.
                All fields are validated to ensure data integrity.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I export my inventory data?</AccordionTrigger>
              <AccordionContent>
                Yes! You can export your inventory data in multiple formats including CSV, Excel, and PDF.
                Use the export button in the top right corner of the inventory table.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Built with Symfony + React + TailwindCSS + shadcn/ui
        </div>
      </div>
    </TooltipProvider>
  );
}
