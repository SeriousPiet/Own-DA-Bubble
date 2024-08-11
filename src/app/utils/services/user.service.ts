import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, doc, getDoc, query, getDocs, where } from '@angular/fire/firestore';
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


    getAllUserIDs(): string[] {
        return this.users.map((user) => user.id);
    }


    getUserByID(id: string): User | undefined {
        return this.users.find((user) => user.id === id);
    }


    updateUserOnFirestore(userID: string, userChangeData: { name?: string, chatIDs?: string[], avatar?: number }) {
        updateDoc(doc(this.firestore, '/users/' + userID), userChangeData)
            .then(() => {
                console.warn('userservice/firestore: User updated(', userID, ')');
            })
            .catch((error) => {
                console.error('userservice/firestore: Error updating user(', error.message, ')');
            });
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


    async registerNewUser(user: { email: string, password: string, name: string }): Promise<boolean> {
        createUserWithEmailAndPassword(this.firebaseauth, user.email, user.password)
            .then((response) => {
                this.addUserToFirestore({ name: user.name, email: response.user.email })
                    .then((userID) => {
                        updateProfile(response.user, { displayName: userID })
                            .then(() => {
                                return true;
                            })
                    })
            })
            .catch((error) => {
                console.error('userservice/auth: Error registering user(', error.message, ')');
                return false;
            });
        return false;
    }


    private initUserCollection(): void {
        this.unsubUsers = onSnapshot(collection(this.firestore, '/users'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    this.users.push(new User(change.doc.data()));
                }
                if (change.type === 'modified') {
                    const user = this.users.find((user) => user.id === change.doc.data()['id']);
                    if (user) user.update(change.doc.data());
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
                this.getAuthUserFromFirestore(user)
                    .then((user) => {
                        console.warn('user login - ' + (user ? user.email : 'no user'));
                        if (this.currentUser) this.setOnlineStatus(this.currentUser.id, false);
                        this.currentUser = user;
                        if (user) this.setOnlineStatus(user.id, true);
                    })
            }
            else if (this.currentUser) {
                console.warn('user logout - ' + this.currentUser.email);
                this.setOnlineStatus(this.currentUser.id, false);
                this.currentUser = undefined;
            }
        })
    }


    private async getAuthUserFromFirestore(user: any): Promise<User | undefined> {
        const userID = await this.getUserIdFromFirestore(user);
        if (userID) {
            const querySnapshot = await getDoc(doc(this.firestore, '/users/' + userID));
            if (querySnapshot.exists()) {
                return new User(querySnapshot.data());
            }
        }
        return undefined;
    }


    private async getUserIdFromFirestore(user: any): Promise<string | undefined> {
        if (user.displayName == null || user.displayName === '') {
            const querySnapshot = await getDocs(
                query(collection(this.firestore, '/users'), where('email', '==', user.email))
            );
            if (querySnapshot.docs.length > 0) {
                const userObj = querySnapshot.docs[0];
                return userObj.id;
            } else {
                return undefined;
            }
        }
        return user.displayName;
    }


    private async setOnlineStatus(userID: string, online: boolean): Promise<void> {
        await updateDoc(doc(this.firestore, '/users/' + userID), { online: online });
    }


    private async addUserToFirestore(user: any): Promise<string> {
        const userObj = {
            name: user.name,
            email: user.email,
            online: false,
            avatar: 0
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

