import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

export default function TagInput({ value = [], onChange, placeholder = "Add tags..." }) {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0); // Track selected suggestion index
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
                    setSelectedIndex(0); // Reset selection on new suggestions
                }
            } catch (error) {
                console.error("Failed to fetch tags", error);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue]);

    // Use a derived list of suggestions that aren't already selected for easier index math
    const availableSuggestions = suggestions.filter(s => !value.includes(s.name));

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (availableSuggestions.length > 0) {
                setSelectedIndex(prev => (prev + 1) % availableSuggestions.length);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (availableSuggestions.length > 0) {
                setSelectedIndex(prev => (prev - 1 + availableSuggestions.length) % availableSuggestions.length);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (open && availableSuggestions.length > 0) {
                // Select from suggestions
                handleSelect(availableSuggestions[selectedIndex].name);
            } else if (inputValue.trim()) {
                // Add current input as new tag
                const newTag = inputValue.trim();
                if (!value.includes(newTag)) {
                    onChange([...value, newTag]);
                }
                setInputValue("");
                setOpen(false);
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            // Remove last tag
            onChange(value.slice(0, -1));
        } else if (e.key === 'Escape') {
            setOpen(false);
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
                            {availableSuggestions.length === 0 ? (
                                <CommandEmpty className="px-2 py-1.5 text-xs text-muted-foreground">
                                    Press Enter to create "{inputValue}"
                                </CommandEmpty>
                            ) : (
                                <CommandGroup heading="Suggestions">
                                    {availableSuggestions.map((suggestion, index) => (
                                        <CommandItem
                                            key={suggestion.id}
                                            value={suggestion.name}
                                            onSelect={() => handleSelect(suggestion.name)}
                                            className={`cursor-pointer ${index === selectedIndex ? "bg-accent text-accent-foreground" : ""}`}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <Check className={value.includes(suggestion.name) ? "opacity-100" : "opacity-0"} />
                                                {suggestion.name}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}
