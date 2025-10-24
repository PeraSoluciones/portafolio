'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import { Behavior, BehaviorRecord } from '@/types/index';
import { Calendar, Save, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { formatedCurrentDate } from '@/lib/utils';

interface BehaviorRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  behavior: Behavior | null;
  behaviorRecord?: BehaviorRecord | null;
  onSuccess: () => void;
}

export default function BehaviorRecordModal({
  isOpen,
  onClose,
  behavior,
  behaviorRecord,
  onSuccess,
}: BehaviorRecordModalProps) {
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(
    formatedCurrentDate('en-CA', 'America/Guayaquil')
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Efecto para cargar los datos del registro cuando se abre en modo edición
  useEffect(() => {
    if (behaviorRecord) {
      setNotes(behaviorRecord.notes || '');
      setDate(behaviorRecord.date);
    } else {
      setNotes('');
      setDate(formatedCurrentDate('en-CA', 'America/Guayaquil'));
    }
  }, [behaviorRecord, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!behavior) {
      toast({
        title: 'Error de validación',
        description: 'Debes seleccionar un comportamiento',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      let error;

      if (behaviorRecord) {
        // Modo edición - actualizar registro existente
        const { error: updateError } = await supabase
          .from('behavior_records')
          .update({
            date: date,
            notes: notes || null,
          })
          .eq('id', behaviorRecord.id);

        error = updateError;
      } else {
        // Modo creación - insertar nuevo registro
        const { error: insertError } = await supabase
          .from('behavior_records')
          .insert([
            {
              behavior_id: behavior.id,
              date: date,
              notes: notes || null,
            },
          ]);

        error = insertError;
      }

      if (error) {
        toast({
          title: behaviorRecord
            ? 'Error al actualizar el registro'
            : 'Error al registrar el comportamiento',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: behaviorRecord
          ? 'Registro actualizado'
          : 'Comportamiento registrado',
        description: behaviorRecord
          ? 'El registro se ha actualizado correctamente'
          : 'El comportamiento se ha registrado correctamente',
        variant: 'success',
      });

      // Limpiar formulario y cerrar modal
      setNotes('');
      setDate(formatedCurrentDate('en-CA', 'America/Guayaquil')); // Establecer la fecha actual en el campo de fecha
      onClose();
      onSuccess();
    } catch (err) {
      toast({
        title: behaviorRecord
          ? 'Error al actualizar el registro'
          : 'Error al registrar el comportamiento',
        description: behaviorRecord
          ? 'Ocurrió un error inesperado al actualizar el registro'
          : 'Ocurrió un error inesperado al registrar el comportamiento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNotes('');
      setDate(formatedCurrentDate('en-CA', 'America/Guayaquil'));
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Calendar className='h-5 w-5 text-blue-600' />
            <span>
              {behaviorRecord ? 'Editar Registro' : 'Registrar Comportamiento'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {behaviorRecord
              ? `Edita la instancia del comportamiento "${behavior?.title}".`
              : `Registra una instancia del comportamiento "${behavior?.title}" para el seguimiento.`}
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
              max={formatedCurrentDate('en-CA', 'America/Guayaquil')}
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
                    behavior.type === 'POSITIVE'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {behavior.type === 'POSITIVE' ? '+' : '-'}
                  {behavior.points} pts
                </span>
              </div>
            </div>
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
              {isLoading
                ? behaviorRecord
                  ? 'Actualizando...'
                  : 'Registrando...'
                : behaviorRecord
                ? 'Actualizar'
                : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
