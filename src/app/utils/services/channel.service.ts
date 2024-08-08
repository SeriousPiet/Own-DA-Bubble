/**
 * @file Channel Service
 * @description This service handles the addition of new channels to the database.
 * @author Bela Schramm
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, Firestore, onSnapshot, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Channel } from '../../shared/models/channel.class';

/**
 * @class ChannelService
 * @description Service that handles the retrieval and addition of channels to the database.
 * @author Bela Schramm
 */
@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {

  /**
   * @description Firestore instance.
   * @type {Firestore}
   */
  private firestore = inject(Firestore);

  /**
   * @description Users service instance.
   * @type {UsersService}
   */
  private userservice = inject(UsersService);

  /**
   * @description Unsubscribe function for the channels subscription.
   * @type {any}
   */
  private unsubChannels: any;

  /**
   * @description List of channels.
   * @type {Channel[]}
   */
  public channels: Channel[] = [];

  /**
   * @constructor
   * @description Constructor that subscribes to the channels collection.
   */
  constructor() {
    this.unsubChannels = onSnapshot(collection(this.firestore, '/channels'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          this.channels.push(new Channel(change.doc.data(), change.doc.id));
        }
        if (change.type === 'modified') {
          this.channels = this.channels.map((channel) => {
            if (channel.id === change.doc.data()['id']) {
              return new Channel(change.doc.data(), change.doc.id);
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


  /**
   * @method addNewChannelToFirestore
   * @description Adds a new channel to the database.
   * @param {string} name - The name of the channel.
   * @param {string} description - The description of the channel.
   * @param {string[]} membersIDs - The ids of the members of the channel.
   */
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


  /**
   * @method ngOnDestroy
   * @description Unsubscribes from the channels subscription on component destruction.
   */
  ngOnDestroy(): void {
    if (this.unsubChannels) {
      this.unsubChannels();
    }
  }

}
