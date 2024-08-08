import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, Firestore, onSnapshot, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Channel } from '../../shared/models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {

  private firestore = inject(Firestore);
  private userservice = inject(UsersService);
  private unsubChannels: any;

  public channels: Channel[] = [];

  constructor() {
    this.unsubChannels = onSnapshot(collection(this.firestore, '/channels'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          this.channels.push(new Channel(change.doc.data()));
        }
        if (change.type === 'modified') {
          this.channels = this.channels.map((channel) => {
            if (channel.id === change.doc.data()['id']) {
              return new Channel(change.doc.data());
            }
            return channel;
          });
        }
        if (change.type === 'removed') {
          this.channels = this.channels.filter((channel) => channel.id !== change.doc.data()['id']);
        }
      });
    });
  }


  addNewChannelToFirestore(name: string, description: string, membersIDs: string[]) {
    const newchannel = {
      name: name,
      description: description,
      memberIDs: membersIDs,
      createdAt: serverTimestamp(),
      creatorID: this.userservice.currentUser ? this.userservice.currentUser.id : '??? unknow userID ???',
    };
    let channelCollectionref = collection(this.firestore, '/channels');
    addDoc(channelCollectionref, newchannel)
      .then((docRef) => {
        updateDoc(docRef, { id: docRef.id })
          .then(() => {
            console.warn('ChannelService: addNewChannelToFirestore: channel added');
          })
      })
  }


  ngOnDestroy(): void {
    if (this.unsubChannels) {
      this.unsubChannels();
    }
  }


}
