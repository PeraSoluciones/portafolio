'use client';

import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { Behavior } from '@/types/index';
import { Calendar, Save, X } from 'lucide-react';

interface BehaviorRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  behavior: Behavior | null;
  onSuccess: () => void;
}

export default function BehaviorRecordModal({
  isOpen,
  onClose,
  behavior,
  onSuccess,
}: BehaviorRecordModalProps) {
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!behavior) {
      setError('No se ha seleccionado un comportamiento');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from('behavior_records')
        .insert([
          {
            behavior_id: behavior.id,
            date: date,
            notes: notes || null,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Limpiar formulario y cerrar modal
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
      onSuccess();
    } catch (err) {
      setError('Ocurrió un error inesperado al registrar el comportamiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Calendar className='h-5 w-5 text-blue-600' />
            <span>Registrar Comportamiento</span>
          </DialogTitle>
          <DialogDescription>
            Registra una instancia del comportamiento "{behavior?.title}" para
            el seguimiento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='date'>Fecha</Label>
            <Input
              id='date'
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notas (opcional)</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Agrega detalles sobre esta instancia del comportamiento...'
              rows={3}
            />
          </div>

          {behavior && (
            <div className='p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>Comportamiento:</span>
                <span className='text-gray-600'>{behavior.title}</span>
              </div>
              <div className='flex items-center justify-between text-sm mt-1'>
                <span className='font-medium'>Tipo:</span>
                <span
                  className={`font-medium ${
                    behavior.type === 'POSITIVE'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {behavior.type === 'POSITIVE' ? 'Positivo' : 'Negativo'}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm mt-1'>
                <span className='font-medium'>Puntos:</span>
                <span
                  className={`font-medium ${
                    behavior.points > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {behavior.points > 0 ? '+' : ''}
                  {behavior.points} pts
                </span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className='flex space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className='h-4 w-4 mr-2' />
              Cancelar
            </Button>
            <Button type='submit' disabled={isLoading}>
              <Save className='h-4 w-4 mr-2' />
              {isLoading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
