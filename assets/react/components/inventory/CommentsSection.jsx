import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { useMercure } from '@/hooks/use-mercure';
import { t } from '@/lib/i18n';

export default function CommentsSection({ inventoryId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [content, setContent] = useState('');
    const scrollRef = useRef(null);
    const intervalRef = useRef(null);

    const fetchComments = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const response = await fetch(`/api/inventories/${inventoryId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
                // Scroll to bottom on initial load
                if (!isBackground) {
                    setTimeout(scrollToBottom, 100);
                }
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        fetchComments();
    }, [inventoryId]);

    // Real-time updates
    useMercure([`/inventory/${inventoryId}/comments`], (data, type) => {
        if (type === 'comment') {
            setComments(prev => {
                // Prevent duplicates if user just sent it (though socket usually faster than fetch, let's be safe)
                if (prev.some(c => c.id === data.id)) return prev;
                return [...prev, data];
            });
            setTimeout(scrollToBottom, 100);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || !currentUser) return;

        setSending(true);
        try {
            const response = await fetch(`/api/inventories/${inventoryId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.trim() })
            });

            if (response.ok) {
                const newComment = await response.json();
                setComments(prev => {
                    if (prev.some(c => c.id === newComment.id)) return prev;
                    return [...prev, newComment];
                });
                setContent('');
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Failed to send comment:', error);
        } finally {
            setSending(false);
        }
    };

    // Group comments? No, requirement says "Linear".

    return (
        <Card className="h-[480px] flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {t('comments.title', 'Discussion')}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                {/* Comments List */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            {t('common.loading', 'Loading messages...')}
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <MessageSquare className="h-10 w-10 mb-2" />
                            <p>{t('comments.empty', 'No comments yet. Start the discussion!')}</p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const isMe = currentUser && comment.user.id === currentUser.id;
                            return (
                                <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={comment.user.avatarUrl} />
                                        <AvatarFallback>{comment.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm font-semibold">{comment.user.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted rounded-tl-none'
                                            }`}>
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                {currentUser ? (
                    <div className="p-4 border-t">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t('comments.placeholder', 'Type a message...')}
                                className="min-h-[44px] max-h-32 resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" disabled={!content.trim() || sending}>
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="p-4 border-t bg-muted/20 text-center text-sm text-muted-foreground">
                        {t('comments.login_required', 'Please log in to participate in the discussion.')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
