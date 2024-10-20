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
        apiKey: 'AIzaSyCDDo4PepMkg9QZc9zQEjxzSi3ftvzYbMw',
        authDomain: 'own-da-bubble-ce3cd.firebaseapp.com',
        projectId: 'own-da-bubble-ce3cd',
        storageBucket: 'own-da-bubble-ce3cd.appspot.com',
        messagingSenderId: '693116910851',
        appId: '1:693116910851:web:60ac06722194f7a02c3d36',
        measurementId: 'G-XDGBVBLHHG',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
};
