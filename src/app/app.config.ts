import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'dabubble-303',
        appId: '1:1022226466324:web:635cc005dcb75daad10901',
        storageBucket: 'dabubble-303.appspot.com',
        apiKey: 'AIzaSyAD6_zJLwvEEll3FpZY_ovzJT78G9kBFAY',
        authDomain: 'dabubble-303.firebaseapp.com',
        messagingSenderId: '1022226466324',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
};
