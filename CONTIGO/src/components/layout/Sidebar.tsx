"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Target,
  Star,
  Trophy,
  BookOpen,
  Menu,
  X,
  LogOut,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rutinas", href: "/routines", icon: Calendar },
  { name: "Hábitos", href: "/habits", icon: Target },
  { name: "Comportamientos", href: "/behaviors", icon: Star },
  { name: "Recompensas", href: "/rewards", icon: Trophy },
  { name: "Recursos", href: "/resources", icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user, children, selectedChild, setSelectedChild, clearStore } = useAppStore()
  const router = useRouter()

  const getADHDTypeLabel = (type: string) => {
    switch (type) {
      case 'INATTENTIVE': return 'Inatento';
      case 'HYPERACTIVE': return 'Hiperactivo';
      case 'COMBINED': return 'Combinado';
      default: return type;
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearStore()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-xl font-bold">CONTIGO</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      {/* Selector de hijos */}
      {children.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-sidebar-foreground/70 mb-3">Mis hijos</h2>
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className={`cursor-pointer transition-all duration-200 rounded-lg p-2 ${
                  selectedChild?.id === child.id
                    ? 'bg-primary/10'
                    : 'hover:bg-slate-200'
                }`}
                onClick={() => setSelectedChild(child)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={child.avatar_url} />
                    <AvatarFallback className="text-sm font-medium">{child.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{child.name}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate">{child.age} años</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getADHDTypeLabel(child.adhd_type)}
                  </Badge>
                </div>
              </div>
            ))}
            <Link href="/children/new" onClick={() => setOpen(false)}>
              <div className="cursor-pointer transition-all duration-200 rounded-lg p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <Plus className="h-4 w-4 text-sidebar-foreground/70" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Agregar hijo</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
      
      {/* Sección del usuario en la parte inferior */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full place-content-center text-sidebar-foreground border-sidebar-border hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
        <div className="mt-3 text-xs text-sidebar-foreground/50">
          © 2025 CONTIGO
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>

      {/* Sidebar móvil */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}