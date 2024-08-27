import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsersService } from '../services/user.service';

export const currentUserExistsGuard: CanActivateFn = (route, state) => {
  const userservice = inject(UsersService);
  const router = inject(Router);

  if(!userservice.currentUser) router.navigate(['']);
  return true;
};
