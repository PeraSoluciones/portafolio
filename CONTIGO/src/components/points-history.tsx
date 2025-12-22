'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Gift,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw,
  Eye,
  Loader2,
} from 'lucide-react';
import { PointsBadge } from '@/components/ui/points-badge';
import {
  fetchPointsHistory,
  formatTransactionForDisplay,
  PointsHistoryResponse,
} from '@/lib/services/points-history-service';
import { cn } from '@/lib/utils';

interface PointsHistoryProps {
  childId: string;
  childName: string;
}

export function PointsHistory({ childId, childName }: PointsHistoryProps) {
  const [data, setData] = useState<PointsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar datos solo cuando el dialog se abre
  useEffect(() => {
    if (!childId || !isOpen) return;

    // Si ya tenemos datos, no volver a cargar
    if (data) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPointsHistory(childId);
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar el historial de puntos'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [childId, isOpen, data]);

  // Cargar más transacciones (paginación infinita)
  const handleLoadMore = async () => {
    if (!data || isLoadingMore || !data.pagination.has_more) return;

    try {
      setIsLoadingMore(true);
      const moreTransactions = await fetchPointsHistory(
        childId,
        20,
        data.transactions.length
      );

      setData({
        ...data,
        transactions: [...data.transactions, ...moreTransactions.transactions],
        pagination: moreTransactions.pagination,
      });
    } catch (err) {
      console.error('Error loading more transactions:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Formatear transacciones para mostrar
  const formattedTransactions = useMemo(() => {
    if (!data) return [];
    return data.transactions.map(formatTransactionForDisplay);
  }, [data]);

  // Transacciones filtradas por tipo
  const positiveTransactions = useMemo(
    () => formattedTransactions.filter((t) => t.isPositive),
    [formattedTransactions]
  );

  const negativeTransactions = useMemo(
    () => formattedTransactions.filter((t) => t.isNegative),
    [formattedTransactions]
  );

  // Renderizar el contenido del dialog según el estado
  const renderDialogContent = () => {
    if (loading) {
      return (
        <div className='space-y-4'>
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='space-y-1 flex-1'>
                  <Skeleton className='h-4 w-full max-w-xs' />
                  <Skeleton className='h-3 w-full max-w-xs' />
                </div>
                <Skeleton className='h-6 w-16' />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='text-center py-6'>
          <p className='text-destructive mb-4'>{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setData(null); // Reset para permitir recargar
            }}
            variant='outline'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Reintentar
          </Button>
        </div>
      );
    }

    if (!data) {
      return null;
    }

    return (
      <div className='space-y-4 flex flex-col grow min-h-0'>
        {/* Resumen de puntos */}
        <Card>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-[1fr_auto_1fr] gap-4 text-center'>
              <div>
                <p className='text-2xl font-bold text-success'>
                  {data.stats.total_earned}
                </p>
                <p className='text-sm text-muted-foreground'>Ganados</p>
              </div>
              <div>
                <PointsBadge points={data.balance} size='lg' />
                <p className='text-sm text-muted-foreground mt-1'>
                  Balance actual
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-destructive'>
                  {Math.abs(data.stats.total_spent)}
                </p>
                <p className='text-sm text-muted-foreground'>Perdidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pestañas de transacciones */}
        <Tabs defaultValue='all' className='w-full flex flex-col grow min-h-0'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='all'>
              Todas ({formattedTransactions.length})
            </TabsTrigger>
            <TabsTrigger value='positive'>
              <TrendingUp className='h-4 w-4 mr-1' />
              Ganadas ({positiveTransactions.length})
            </TabsTrigger>
            <TabsTrigger value='negative'>
              <TrendingDown className='h-4 w-4 mr-1' />
              Perdidas ({negativeTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='mt-4 grow overflow-y-auto'>
            <TransactionList
              transactions={formattedTransactions}
              onLoadMore={handleLoadMore}
              hasMore={data.pagination.has_more}
              isLoadingMore={isLoadingMore}
            />
          </TabsContent>

          <TabsContent value='positive' className='mt-4 grow overflow-y-auto'>
            <TransactionList
              transactions={positiveTransactions}
              onLoadMore={() => {}}
              hasMore={false}
              isLoadingMore={false}
            />
          </TabsContent>

          <TabsContent value='negative' className='mt-4 grow overflow-y-auto'>
            <TransactionList
              transactions={negativeTransactions}
              onLoadMore={() => {}}
              hasMore={false}
              isLoadingMore={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant='outline' size='sm' className='gap-2'>
          <Eye className='h-4 w-4' />
          Ver historial
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Historial de Puntos - {childName}
          </DialogTitle>
          <DialogDescription>
            Todas las transacciones de puntos de {childName}
          </DialogDescription>
        </DialogHeader>
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}

// Componente interno para la lista de transacciones
function TransactionList({
  transactions,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: {
  transactions: ReturnType<typeof formatTransactionForDisplay>[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <div className='text-center py-8'>
        <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <p className='text-muted-foreground'>
          No hay transacciones para mostrar
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className='h-full pr-4'>
      <div className='space-y-3'>
        {transactions.map((transaction, index) => (
          <div key={transaction.id}>
            <div className='flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors'>
              {/* Icono de la transacción */}
              <div className='text-2xl shrink-0 mt-1'>{transaction.icon}</div>

              {/* Detalles de la transacción */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-1'>
                  <Badge variant='outline' className='text-xs'>
                    {transaction.typeLabel}
                  </Badge>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      transaction.isPositive
                        ? 'text-success'
                        : 'text-destructive'
                    )}
                  >
                    {transaction.formattedPoints}
                  </span>
                </div>
                <p className='text-sm font-medium text-foreground truncate'>
                  {transaction.description}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {transaction.formattedDate}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Balance después:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      transaction.balance_after < 0
                        ? 'text-destructive'
                        : transaction.balance_after > 0
                        ? 'text-success'
                        : 'text-muted-foreground'
                    )}
                  >
                    {transaction.balance_after > 0
                      ? `+${transaction.balance_after}`
                      : transaction.balance_after}{' '}
                    pts
                  </span>
                </p>
              </div>
            </div>
            {index < transactions.length - 1 && <Separator className='my-2' />}
          </div>
        ))}

        {/* Botón para cargar más */}
        {hasMore && (
          <div className='flex justify-center pt-4'>
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant='outline'
              size='sm'
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Cargando...
                </>
              ) : (
                'Cargar más'
              )}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
