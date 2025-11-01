'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, Send } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

// Definimos los tipos de los mensajes del chat con Zod
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

type Message = z.infer<typeof messageSchema>;

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: 'El mensaje no puede estar vacío.',
  }),
});

export default function ActionPlanGeneratorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: Message = {
      role: 'user',
      content: values.prompt.trim(),
    };

    // Añadimos el mensaje del usuario al historial
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    form.reset();

    try {
      const response = await fetch('/api/action-plan-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.reply,
      };

      // Añadimos la respuesta del asistente al historial
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate action plan:', error);
      // Aquí podrías manejar el error, por ejemplo, con un toast
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] container mx-auto py-4 px-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">
          Asesor de Planes de Acción
        </h1>
        <p className="text-muted-foreground mt-2">
          Chatea con un experto en TDAH para obtener planes de acción personalizados.
        </p>
      </div>

      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle>Conversación</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-0">
          <ScrollArea ref={scrollAreaRef} className="flex-grow p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  ¡Hola! Soy tu asesor experto en TDAH. Describe el desafío que estás enfrentando y te ayudaré a crear un plan de acción.
                </p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <User className="h-6 w-6 text-primary-foreground" />
                      ) : (
                        <Bot className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      'flex-grow prose prose-sm max-w-none',
                      message.role === 'user'
                        ? 'prose-invert'
                        : 'dark:prose-invert'
                    )}>
                      {message.role === 'user' ? (
                        <p className="text-primary-foreground">{message.content}</p>
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted">
                  <Bot className="h-6 w-6 animate-pulse" />
                  <p className="text-muted-foreground">Escribiendo...</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Textarea
                          placeholder="Escribe tu mensaje aquí..."
                          className="resize-none"
                          {...field}
                          rows={2}
                          disabled={isLoading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}