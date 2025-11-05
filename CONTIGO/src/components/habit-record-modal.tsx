'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/database';

interface HabitRecordModalProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function HabitRecordModal({
  habit,
  open,
  onOpenChange,
  onSuccess,
}: HabitRecordModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [value, setValue] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset form when habit changes
  useState(() => {
    if (habit) {
      setValue(1);
      setNotes('');
      setDate(new Date());
    }
  });

  if (!habit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      
      const { error } = await supabase
        .from('habit_records')
        .upsert({
          habit_id: habit.id,
          date: date.toISOString().split('T')[0],
          value,
          notes,
        }, {
          onConflict: 'habit_id,date',
        });

      if (error) {
        toast({
          title: 'Error al registrar hábito',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Hábito registrado!',
          description: `${habit.title} ha sido registrado correctamente.`,
          variant: 'success',
        });
        
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al registrar el hábito.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementValue = () => {
    if (value < habit.target_frequency * 2) { // Límite máximo para evitar abusos
      setValue(value + 1);
    }
  };

  const decrementValue = () => {
    if (value > 0) {
      setValue(value - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar cumplimiento</DialogTitle>
          <DialogDescription>
            Registra el progreso de "{habit.title}" para el día seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="value">Valor registrado</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={decrementValue}
                  disabled={value <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={habit.target_frequency * 2}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="text-center"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={incrementValue}
                  disabled={value >= habit.target_frequency * 2}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Objetivo: {habit.target_frequency} {habit.unit}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas sobre el cumplimiento de este hábito..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}