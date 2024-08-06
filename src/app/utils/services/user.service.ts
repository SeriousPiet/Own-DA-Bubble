import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, doc, getDoc } from '@angular/fire/firestore';
import { User } from '../../shared/models/user.class';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, user } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class UsersService implements OnDestroy {

    private firestore = inject(Firestore);
    private firebaseauth = inject(Auth);
    private unsubUsers: any = null;
    private user$: any = null;

    public users: User[] = [];
    public currentUser: User | undefined;

    constructor() {
        this.initUserCollection();
        this.initUserWatchDog();
    }


    private initUserCollection(): void {
        this.unsubUsers = onSnapshot(collection(this.firestore, '/users'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    this.users.push(new User(change.doc.data()));
                }
                if (change.type === 'modified') {
                    this.users = this.users.map((user) => {
                        if (user.email === change.doc.data()['email']) {
                            return new User(change.doc.data());
                        }
                        return user;
                    });
                }
                if (change.type === 'removed') {
                    this.users = this.users.filter((user) => user.email !== change.doc.data()['email']);
                }
            });
        });
    }


    private initUserWatchDog(): void {
        this.user$ = user(this.firebaseauth).subscribe((user) => {
            if (user) {
                this.getUserFromFirestoreByID(user.displayName)
                    .then((user) => {
                        console.log('user login - ' + (user ? user.email : 'no user'));
                        this.currentUser = user;
                        if (this.currentUser) this.updateUserOnFirestore(this.currentUser.id, { online: true });
                    })
            }
            else if (this.currentUser) {
                console.log('user logout - ' + this.currentUser.email);
                this.updateUserOnFirestore(this.currentUser.id, { online: false });
                this.currentUser = undefined;
            }
        })
    }


    private async getUserFromFirestoreByID(userID: string | null): Promise<User | undefined> {
        if (userID == null) return undefined;
        const userObj = await getDoc(doc(this.firestore, '/users/' + userID));
        return new User(userObj.data());
    }


    logoutUser(): void {
        if (this.currentUser) {
            signOut(this.firebaseauth);
        }
    }


    async loginUser(email: string, password: string): Promise<string | undefined> {
        return await signInWithEmailAndPassword(this.firebaseauth, email, password)
            .then((response) => {
                return undefined;
            })
            .catch((error) => {
                console.error('userservice/auth: Error logging in user(', error.message, ')');
                return error.message;
            });
    }


    async registerNewUser(user: { email: string, password: string, name: string }): Promise<User | undefined> {
        createUserWithEmailAndPassword(this.firebaseauth, user.email, user.password)
            .then((response) => {
                this.addUserToFirestore({ name: user.name, email: response.user.email })
                    .then((userID) => {
                        updateProfile(response.user, { displayName: userID });
                    })
            })
            .catch((error) => {
                console.error('userservice/auth: Error registering user(', error.message, ')');
                return undefined;
            });
        return undefined;
    }


    private async updateUserOnFirestore(userID: string, userChangeData: any): Promise<void> {
        await updateDoc(doc(this.firestore, '/users/' + userID), userChangeData);
    }


    private async addUserToFirestore(user: any): Promise<string> {
        const userObj = {
            name: user.name,
            email: user.email,
        };
        let ref = collection(this.firestore, '/users');
        let newUser = await addDoc(ref, userObj);
        await updateDoc(doc(this.firestore, '/users/' + newUser.id), { id: newUser.id });
        return newUser.id;
    }


    ngOnDestroy(): void {
        if (this.unsubUsers) {
            this.unsubUsers();
        }
        if (this.user$) {
            this.user$.unsubscribe();
        }
    }
}
