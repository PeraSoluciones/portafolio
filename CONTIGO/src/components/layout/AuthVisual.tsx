import Image from 'next/image';
import React from 'react';
import Logo from '../../../public/logo.svg';

export const AuthVisual: React.FC = () => {
  return (
    <div className='lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-[hsl(204,78%,43%)] to-[hsl(271,31%,44%)] text-white relative overflow-hidden'>
      {/* Elementos decorativos de fondo para mejorar el contraste */}
      <div className='absolute inset-0 bg-black/10'></div>
      <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent'></div>
      
      {/* Círculos decorativos con animación */}
      <div className='absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse'></div>
      <div className='absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse' style={{ animationDelay: '1s' }}></div>
      
      <div className='max-w-md text-center space-y-6 relative z-10'>
        {/* Contenedor del logo con efecto de resplandor animado para mejor contraste */}
        <div className='relative inline-block'>
          {/* Resplandor animado con efecto de pulso */}
          <div className='absolute inset-0 bg-white/20 rounded-full blur-md scale-110 animate-pulse'></div>
          {/* Segundo resplandor con animación retardada para efecto de onda */}
          <div className='absolute inset-0 bg-white/10 rounded-full blur-lg scale-125 animate-pulse' style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
          
          {/* Logo con animación de flotación */}
          <div className='relative z-10 animate-float'>
            <Image
              src={Logo}
              alt='CONTIGO Logo'
              width={120}
              height={120}
              className='mx-auto drop-shadow-lg transform transition-transform duration-300 hover:scale-110'
            />
          </div>
        </div>
        
        {/* Título con animación de aparición gradual */}
        <h1 className='text-4xl lg:text-6xl font-bold tracking-tight drop-shadow-lg animate-fade-in-up' style={{ animationDelay: '0.3s' }}>
          CONTIGO
        </h1>
        
        {/* Párrafo con animación de aparición gradual */}
        <p className='text-lg lg:text-xl opacity-95 drop-shadow-md max-w-sm mx-auto animate-fade-in-up' style={{ animationDelay: '0.6s' }}>
          Gestiona rutinas, fomenta hábitos y recompensa logros. La herramienta
          ideal para padres de niños con TDAH.
        </p>
        
        {/* Contenedor de imagen con borde para mejorar el contraste y animación de aparición */}
        <div className='w-full h-64 lg:h-96 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-sm animate-fade-in-up' style={{ animationDelay: '0.9s' }}>
          <img
            src='https://res.cloudinary.com/dibmjjktr/image/upload/v1760506701/fondo_login_dpzel0.jpg'
            alt='Madre e hijo juntos'
            className='w-full h-full object-cover transform hover:scale-105 transition-transform duration-500'
          />
        </div>
      </div>
      
      {/* Estilos de animación personalizados */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};
