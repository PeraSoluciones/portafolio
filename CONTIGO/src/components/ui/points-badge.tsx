import { Badge } from '@/components/ui/badge';
import { Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  className?: string;
}

export function PointsBadge({
  points,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className,
}: PointsBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-lg';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        if (points > 0) {
          return 'bg-chart-5 text-chart-5-foreground border-chart-5';
        } else if (points < 0) {
          return 'bg-destructive text-destructive-foreground border-destructive';
        } else {
          return 'bg-muted text-muted-foreground border-muted';
        }
      case 'outline':
        if (points > 0) {
          return 'border-chart-5 text-chart-5-foreground bg-chart-5/10 hover:bg-chart-5/20';
        } else if (points < 0) {
          return 'border-destructive text-destructive bg-destructive/10 hover:bg-destructive/20';
        } else {
          return 'border-muted text-muted-foreground';
        }
      default:
        if (points > 0) {
          return 'bg-chart-5 text-chart-5-foreground';
        } else if (points < 0) {
          return 'bg-destructive text-destructive-foreground';
        } else {
          return 'bg-muted text-muted-foreground';
        }
    }
  };

  return (
    <Badge
      className={cn(
        'flex items-center gap-1 font-semibold transition-all duration-200',
        getSizeClasses(),
        getVariantClasses(),
        className
      )}
      data-testid="points-badge"
    >
      {showIcon && (
        points > 0 ? (
          <Trophy className={cn(getIconSize(), 'fill-current')} />
        ) : points < 0 ? (
          <Zap className={cn(getIconSize())} />
        ) : (
          <div className={cn(getIconSize(), 'rounded-full bg-current')} />
        )
      )}
      {points > 0 ? `+${points}` : points} pts
    </Badge>
  );
}
