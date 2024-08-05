import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, updateDoc, collection, Firestore, onSnapshot, setDoc, doc } from '@angular/fire/firestore';
import { User } from '../../shared/models/user.class';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class UsersService implements OnDestroy {

    private firestore = inject(Firestore);
    private firebaseauth = inject(Auth);
    private unsubUsers: any;

    public users: User[] = [];
    public currentUser: User | undefined;

    constructor() {
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


    async registerNewUser(user: { email: string, password: string, name: string }): Promise<User | undefined> {
        createUserWithEmailAndPassword(this.firebaseauth, user.email, user.password)
            .then((response) => {
                updateProfile(response.user, { displayName: user.name });
                return this.addUserToFirestore(
                    {
                        name: user.name,
                        email: response.user.email,
                    }
                );
            })
            .catch((error) => {
                console.error('userservice/auth: Error registering user(', error.message, ')');
                return undefined;
            });
        return undefined;
    }


    async updateUserOnFirestore(userID: string, userChangeData: any): Promise<void> {
        await updateDoc(doc(this.firestore, '/users/' + userID), userChangeData);
    }


    async addUserToFirestore(user: any): Promise<User> {
        const userObj = {
            name: user.name,
            email: user.email,
        };
        let ref = collection(this.firestore, '/users');
        let newUser = await addDoc(ref, userObj);
        await updateDoc(doc(this.firestore, '/users/' + newUser.id), { id: newUser.id });
        return new User(userObj);
    }


    ngOnDestroy(): void {
        if (this.unsubUsers) {
            this.unsubUsers();
        }
    }
}
