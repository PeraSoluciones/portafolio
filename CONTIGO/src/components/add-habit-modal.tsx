'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Habit } from '@/types/database';
import { assignHabitToRoutine } from '@/lib/services/routine-habits-service';
import { Search, Plus, Loader2, Star, Filter, CheckCircle } from 'lucide-react';

export interface HabitWithPoints extends Habit {
  selected: boolean;
  assigned: boolean;
  pointsInRoutine: number; // Nuevo campo para puntos en la rutina
}

interface AddHabitModalProps {
  routineId: string;
  childId: string;
  availableHabits: Habit[];
  onClose: () => void;
  onSuccess: () => void;
  onAssign?: (habits: HabitWithPoints[]) => void;
  trigger?: React.ReactNode;
}

export function AddHabitModal({
  routineId,
  childId,
  availableHabits,
  onClose,
  onSuccess,
  onAssign,
  trigger,
}: AddHabitModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [habitsWithSelection, setHabitsWithSelection] = useState<
    HabitWithPoints[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Categorías disponibles
  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'SLEEP', label: 'Sueño' },
    { value: 'NUTRITION', label: 'Nutrición' },
    { value: 'EXERCISE', label: 'Ejercicio' },
    { value: 'HYGIENE', label: 'Higiene' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'ORGANIZATION', label: 'Organización' },
  ];

  // Inicializar los hábitos con estado de selección y puntos
  useEffect(() => {
    const habits: HabitWithPoints[] = availableHabits.map((habit) => ({
      ...habit,
      selected: false,
      assigned: false,
      pointsInRoutine: habit.points_value || 0, // Usar el valor por defecto del hábito
    }));
    setHabitsWithSelection(habits);
  }, [availableHabits]);

  // Filtrar hábitos según búsqueda y categoría
  const filteredHabits = habitsWithSelection.filter((habit) => {
    const matchesSearch =
      habit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (habit.description &&
        habit.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || habit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Manejar selección de hábitos
  const handleHabitSelection = (habitId: string, checked: boolean) => {
    setHabitsWithSelection((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, selected: checked } : habit
      )
    );
  };

  // Manejar cambio en los puntos de un hábito
  const handlePointsChange = (habitId: string, points: number) => {
    setHabitsWithSelection((prev) =>
      prev.map((habit) =>
        habit.id === habitId ? { ...habit, pointsInRoutine: points } : habit
      )
    );
  };

  // Asignar hábitos seleccionados a la rutina
  const handleAssignHabits = async () => {
    const selectedHabitsToAssign = habitsWithSelection.filter(
      (h) => h.selected
    );

    if (selectedHabitsToAssign.length === 0) {
      toast({
        title: 'Selecciona hábitos',
        description: 'Debes seleccionar al menos un hábito para asignar',
        variant: 'destructive',
      });
      return;
    }

    // Si se proporciona onAssign, usarlo en lugar de guardar en DB directamente
    if (onAssign) {
      onAssign(selectedHabitsToAssign);
      setOpen(false);
      onClose();
      onSuccess();
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Asignar cada hábito seleccionado con sus puntos
      for (const habit of selectedHabitsToAssign) {
        try {
          await assignHabitToRoutine(
            routineId,
            habit.id,
            habit.pointsInRoutine // Pasar los puntos de la rutina
          );
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Hábitos asignados',
          description: `${successCount} hábito(s) han sido asignados correctamente a la rutina`,
          variant: 'success',
        });

        // Cerrar modal y actualizar lista
        setOpen(false);
        onClose();
        onSuccess();
      }

      if (errorCount > 0) {
        toast({
          title: 'Error parcial',
          description: `${errorCount} hábito(s) no pudieron ser asignados`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al asignar los hábitos',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SLEEP: 'bg-blue-100 text-blue-800',
      NUTRITION: 'bg-green-100 text-green-800',
      EXERCISE: 'bg-orange-100 text-orange-800',
      HYGIENE: 'bg-purple-100 text-purple-800',
      SOCIAL: 'bg-pink-100 text-pink-800',
      ORGANIZATION: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SLEEP: 'Sueño',
      NUTRITION: 'Nutrición',
      EXERCISE: 'Ejercicio',
      HYGIENE: 'Higiene',
      SOCIAL: 'Social',
      ORGANIZATION: 'Organización',
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className='sm:max-w-[600px] max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Añadir Hábitos a la Rutina</DialogTitle>
          <DialogDescription>
            Selecciona los hábitos que quieres incluir en esta rutina
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col flex-1 overflow-hidden'>
          {/* Búsqueda y filtros */}
          <div className='space-y-4 pb-4'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Buscar hábitos...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>

            <div className='flex flex-wrap gap-2'>
              <div className='flex items-center space-x-1 text-sm text-gray-500'>
                <Filter className='h-4 w-4' />
                <span>Categoría:</span>
              </div>
              {categories.map((category) => (
                <Badge
                  key={category.value}
                  variant={
                    selectedCategory === category.value ? 'default' : 'outline'
                  }
                  className='cursor-pointer'
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Lista de hábitos */}
          <ScrollArea className='flex-1'>
            {filteredHabits.length === 0 ? (
              <div className='text-center py-8'>
                <div className='mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4'>
                  <Search className='h-6 w-6 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No se encontraron hábitos
                </h3>
                <p className='text-gray-500'>
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Intenta ajustar tu búsqueda o filtros'
                    : 'No hay hábitos disponibles para este niño'}
                </p>
              </div>
            ) : (
              <div className='space-y-3 p-1'>
                {filteredHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      habit.selected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={`habit-${habit.id}`}
                      checked={habit.selected}
                      onCheckedChange={(checked) =>
                        handleHabitSelection(habit.id, checked as boolean)
                      }
                      className='mt-0.5'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2 mb-1'>
                        <Label
                          htmlFor={`habit-${habit.id}`}
                          className='font-medium text-gray-900 cursor-pointer'
                        >
                          {habit.title}
                        </Label>
                        <Badge className={getCategoryColor(habit.category)}>
                          {getCategoryLabel(habit.category)}
                        </Badge>
                        {habit.selected && (
                          <CheckCircle className='h-4 w-4 text-blue-500' />
                        )}
                      </div>
                      {habit.description && (
                        <p className='text-sm text-gray-600 mb-2'>
                          {habit.description}
                        </p>
                      )}
                      <div className='flex items-center space-x-4 text-sm text-gray-500 mb-2'>
                        <div className='flex items-center space-x-1'>
                          <span>Meta:</span>
                          <span className='font-medium'>
                            {habit.target_frequency} {habit.unit}
                          </span>
                        </div>
                        {habit.points_value > 0 && (
                          <div className='flex items-center space-x-1'>
                            <Star className='h-4 w-4 text-yellow-500' />
                            <span className='font-medium'>
                              Base: {habit.points_value} pts
                            </span>
                          </div>
                        )}
                      </div>
                      {habit.selected && (
                        <div className='flex items-center space-x-2 mt-2 p-2 bg-white rounded border border-gray-200'>
                          <Label
                            htmlFor={`points-${habit.id}`}
                            className='text-sm font-medium text-gray-700'
                          >
                            Puntos en esta rutina:
                          </Label>
                          <Input
                            id={`points-${habit.id}`}
                            type='number'
                            min='0'
                            max='100'
                            value={habit.pointsInRoutine}
                            onChange={(e) =>
                              handlePointsChange(
                                habit.id,
                                Number(e.target.value)
                              )
                            }
                            className='w-20 h-8 text-sm'
                          />
                          <Star className='h-4 w-4 text-yellow-500' />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Pie del modal */}
        <div className='flex justify-between pt-4'>
          <Button
            variant='outline'
            onClick={() => {
              setOpen(false);
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssignHabits}
            disabled={isSaving || !habitsWithSelection.some((h) => h.selected)}
          >
            {isSaving ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Asignando...
              </>
            ) : (
              <>
                <Plus className='h-4 w-4 mr-2' />
                Asignar Hábito
                {habitsWithSelection.filter((h) => h.selected).length !== 1
                  ? 's'
                  : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
