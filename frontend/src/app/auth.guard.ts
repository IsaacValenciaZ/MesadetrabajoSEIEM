
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const usuarioGuardado = localStorage.getItem('usuario_actual');

  if (usuarioGuardado) {
 
    return true; 
  } else {

    router.navigate(['/login']);
    return false;
  }
};