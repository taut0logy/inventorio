import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

export default function TagInput({ value = [], onChange, placeholder = "Add tags..." }) {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch suggestions
    useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/tags/autocomplete?query=${encodeURIComponent(inputValue)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                }
            } catch (error) {
                console.error("Failed to fetch tags", error);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            // Add current input as tag
            const newTag = inputValue.trim();
            if (!value.includes(newTag)) {
                onChange([...value, newTag]);
            }
            setInputValue("");
            setOpen(false);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            // Remove last tag
            onChange(value.slice(0, -1));
        }
    };

    const handleSelect = (tagName) => {
        if (!value.includes(tagName)) {
            onChange([...value, tagName]);
        }
        setInputValue("");
        setOpen(false);
        inputRef.current?.focus();
    };

    const removeTag = (tagToRemove) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="relative z-50 pointer-events-auto" ref={containerRef}>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                {value.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="hover:bg-secondary/80">
                        {tag}
                        <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => removeTag(tag)}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
                
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent outline-none min-w-[80px] text-sm h-6"
                    placeholder={value.length === 0 ? placeholder : ""}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {open && inputValue.trim().length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden">
                    <Command className="h-full">
                        <CommandList>
                            <CommandEmpty className="px-2 py-1.5 text-xs text-muted-foreground">
                                Press Enter to create "{inputValue}"
                            </CommandEmpty>
                            {suggestions.length > 0 && (
                                <CommandGroup heading="Suggestions">
                                    {suggestions
                                        .filter(s => !value.includes(s.name))
                                        .map(suggestion => (
                                            <CommandItem
                                                key={suggestion.id}
                                                onSelect={() => handleSelect(suggestion.name)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Check className={value.includes(suggestion.name) ? "opacity-100" : "opacity-0"} />
                                                    {suggestion.name}
                                                </div>
                                            </CommandItem>
                                        ))
                                    }
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}
