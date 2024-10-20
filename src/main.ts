import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideAnimations(),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'own-da-bubble-ce3cd',
        appId: '1:693116910851:web:60ac06722194f7a02c3d36',
        storageBucket: 'own-da-bubble-ce3cd.appspot.com',
        apiKey: 'AIzaSyCDDo4PepMkg9QZc9zQEjxzSi3ftvzYbMw',
        authDomain: 'own-da-bubble-ce3cd.firebaseapp.com',
        messagingSenderId: '693116910851',
        measurementId: 'G-XDGBVBLHHG',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
}).catch((err) => console.error(err));
