'use client';

import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useState } from 'react';

export function TestAvatarPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    'https://res.cloudinary.com/dibmjjktr/image/upload/v1757896331/samples/people/boy-snow-hoodie.jpg'
  );
  const userId = 'test-user-id';

  console.log('Renderizando TestAvatarPage. avatarUrl:', avatarUrl);

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    console.log('handleAvatarChange llamado con:', newAvatarUrl);
    setAvatarUrl(newAvatarUrl);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Página de prueba para AvatarUpload</h1>
      <div className="max-w-md mx-auto border p-6 rounded-lg">
        <AvatarUpload
          currentAvatar={avatarUrl ?? undefined}
          onAvatarChange={handleAvatarChange}
          userId={userId}
          name="Test User"
        />
      </div>
      <div className="mt-4">
        <h2 className="text-xl">Estado actual</h2>
        <p>
          URL del avatar: <strong>{avatarUrl || 'Ninguno'}</strong>
        </p>
      </div>
    </div>
  );
}