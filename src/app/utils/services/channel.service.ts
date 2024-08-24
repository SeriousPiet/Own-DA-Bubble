/**
 * @file Channel Service
 * @description This service handles the addition of new channels to the database.
 * @author Bela Schramm
 */

import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { UsersService } from './user.service';
import { Channel } from '../../shared/models/channel.class';

/**
 * @class ChannelService
 * @description Service that handles the retrieval and addition of channels to the database.
 * @author Bela Schramm
 */
@Injectable({
  providedIn: 'root',
})
export class ChannelService implements OnDestroy {
  public defaultChannel: Channel = new Channel({
    name: 'Willkommen',
    description: 'Defaultchannel',
    defaultChannel: true,
  });

  private subscribeUserListChange: any;

  /**
   * @description Firestore instance.
   * @type {Firestore}
   */
  private firestore: Firestore = inject(Firestore);

  /**
   * @description Users service instance.
   * @type {UsersService}
   */
  private userservice: UsersService = inject(UsersService);

  /**
   * @description Unsubscribe function for the channels subscription.
   * @type {any}
   */
  private unsubChannels: any;

  /**
   * @description List of channels.
   * @type {Channel[]}
   */
  public channels: Channel[] = [this.defaultChannel];

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
          const channel = this.channels.find((channel) => channel.id === change.doc.id);
          if (channel) channel.update(change.doc.data());
        }
        if (change.type === 'removed') {
          this.channels = this.channels.filter((channel) => channel.id !== change.doc.id);
        }
      });
    });
    this.subscribeUserListChange = this.userservice.changeUserList$.subscribe(() => {
      this.defaultChannel.update({ members: this.userservice.getAllUserIDs() });
    });
  }

  /**
   * @method addNewChannelToFirestore
   * @description Adds a new channel to the database.
   * @param {string} name - The name of the channel.
   * @param {string} description - The description of the channel.
   * @param {string[]} membersIDs - The ids of the members of the channel.
   */
  async addNewChannelToFirestore(
    name: string,
    description: string,
    membersIDs: string[]
  ) {
    const newchannel = {
      name: name,
      description: description,
      memberIDs: membersIDs,
      createdAt: serverTimestamp(),
      creatorID: this.userservice.currentUserID,
    };
    const channelCollectionref = collection(this.firestore, '/channels');
    try {
      const docRef = await addDoc(channelCollectionref, newchannel);
      console.warn(
        'ChannelService: addNewChannelToFirestore: channel added - ' +
          newchannel.name
      );
    } catch (error) {
      console.error(
        'ChannelService: addNewChannelToFirestore: error adding channel' +
          newchannel.name +
          ' # ',
        error
      );
    }
  }

  /**
   * @method updateChannelOnFirestore
   * @description Updates a channel in the database.
   * @param {Channel} channel - The channel to update.
   * @param {Object} updateData - The data to update in the channel.
   * @param {string} updateData.name - The new name of the channel.
   * @param {string} updateData.description - The new description of the channel.
   * @param {string[]} updateData.memberIDs - The new member IDs of the channel.
   */
  async updateChannelOnFirestore(
    channel: Channel,
    updateData: { name?: string; description?: string; memberIDs?: string[] }
  ) {
    const channelDocRef = doc(this.firestore, '/channels', channel.id);
    try {
      await updateDoc(channelDocRef, updateData);
      console.warn(
        'ChannelService: updateChannelOnFirestore: channel updated ->',
        updateData
      );
    } catch (error) {
      console.error(
        'ChannelService: updateChannelOnFirestore: error updating channel ->',
        error
      );
    }
  }

  /**
   * Lifecycle hook that is called when the component is about to be destroyed.
   * Unsubscribes from channels and unsubscribes from user list change subscription.
   */
  ngOnDestroy(): void {
    if (this.unsubChannels) this.unsubChannels();
    if (this.subscribeUserListChange)
      this.subscribeUserListChange.unsubscribe();
  }
}
