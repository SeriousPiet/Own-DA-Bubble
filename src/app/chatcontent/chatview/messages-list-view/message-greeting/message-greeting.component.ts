import { Component, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import {
  dabubbleBotId,
  removeAllHTMLTagsFromString,
} from '../../../../utils/firebase/utils';
import { ChannelService } from '../../../../utils/services/channel.service';
import { UsersService } from '../../../../utils/services/user.service';

type MessageData = {
  creatorEmail: string;
  createdAt: number;
  message: string;
  answers?: Array<{ creatorEmail: string; createdAt: number; message: string }>;
};

@Component({
  selector: 'app-message-greeting',
  standalone: true,
  imports: [],
  templateUrl: './message-greeting.component.html',
  styleUrl: './message-greeting.component.scss',
})
export class MessageGreetingComponent {
  public userService = inject(UsersService);
  public channelService = inject(ChannelService);
  public firestore = inject(Firestore);
  public adminBotID = dabubbleBotId;

  readonly users = [
    { name: 'Bela Schramm', email: 'belaschramm@aol.de', avatar: 5 },
    { name: 'Anthony Hamon', email: 'contact@anthony-hamon.com', avatar: 3 },
    { name: 'Peter Wallbaum', email: 'peter.kormann1@gmail.com', avatar: 2 },
    {
      name: 'Michael Buschmann',
      email: 'michael.buschmann.86@gmail.com',
      avatar: 1,
    },
  ];

  readonly frontendmessages = [
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1722517200000,
      message:
        '<p>Guten Morgen Team! 👋 Ich habe gerade die Firebase-Integration für unsere Login/Signup-Funktionalität abgeschlossen. Könnt ihr das bitte in euren lokalen Umgebungen testen?</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1722518100000,
          message:
            '<p>Super Arbeit, Bela! 👍 Ich werde es gleich ausprobieren und gebe dir Feedback.</p>',
        },
        {
          creatorEmail: 'contact@anthony-hamon.com',
          createdAt: 1722519000000,
          message:
            '<p>Klasse! Ich bin gespannt, wie sich das auf die Benutzerauthentifizierung in der ChatView auswirkt. Werde es auch testen.</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1722603600000,
      message:
        '<p>Hey Leute, ich habe einige Anpassungen am responsiven Design vorgenommen. Könntet ihr das bitte auf verschiedenen Geräten überprüfen?</p><p>Besonders wichtig sind:</p><ul><li>Mobile Ansicht</li><li>Tablet-Modus</li><li>Desktop mit verschiedenen Auflösungen</li></ul>',
      answers: [],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1722690000000,
      message:
        '<p>Update zum WorkSpaceMenu: Ich habe die Animation beim Öffnen und Schließen optimiert. Es sollte jetzt viel flüssiger laufen. 🚀</p>',
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1722690900000,
          message:
            '<p>Wow, das sieht wirklich smooth aus! Gut gemacht, Peter!</p>',
        },
      ],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1722776400000,
      message:
        '<h2>ChatViewContent Update</h2><p>Ich habe die Darstellung der Nachrichten in der ChatView überarbeitet. Jetzt werden Bilder und Links besser eingebettet. Schaut es euch mal an und gebt mir Feedback! 📸🔗</p>',
      answers: [],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1722862800000,
      message:
        '<p><b>Wichtig:</b> Es gibt ein Problem mit der Firebase-Authentifizierung bei Benutzern, die sich über Google anmelden. Ich arbeite daran, aber falls jemand Zeit hat, könnte ich Unterstützung gebrauchen.</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1722863700000,
          message:
            '<p>Ich kann dir dabei helfen, Bela. Lass uns nach dem Daily kurz zusammensetzen und das gemeinsam angehen.</p>',
        },
        {
          creatorEmail: 'belaschramm@aol.de',
          createdAt: 1722864600000,
          message:
            '<p>Danke, Peter! Das wäre super. Ich bereite schon mal alles vor.</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1722949200000,
      message:
        '<p>Die Suchfunktion ist jetzt implementiert! 🔍 Sie unterstützt Echtzeit-Suche in Kanälen und Direktnachrichten. Bitte testet ausgiebig und meldet etwaige Bugs.</p>',
      answers: [],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1723035600000,
      message:
        '<h3>Profilanzeige Update</h3><p>Die Benutzerprofile zeigen jetzt mehr Details an, einschließlich des Online-Status und der letzten Aktivität. Was haltet ihr davon?</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1723036500000,
          message:
            '<p>Das sieht richtig gut aus, Anthony! Besonders der Online-Status ist sehr nützlich. 👍</p>',
        },
      ],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1723122000000,
      message:
        '<p>Gute Nachrichten! Das Google-Anmeldeproblem ist gelöst. Danke für deine Hilfe, Peter! 🎉</p>',
      answers: [],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1723208400000,
      message:
        '<p>Ich habe das ThreadView-Component fertiggestellt. Es unterstützt jetzt Nested Replies und Lazy Loading für bessere Performance.</p>',
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1723209300000,
          message:
            '<p>Sehr beeindruckend, Peter! Die Performance-Verbesserung ist deutlich spürbar. 🚀</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1723294800000,
      message:
        '<p>Update zum responsiven Design: Ich habe einige Feinabstimmungen vorgenommen, besonders für Tablets im Querformat. Bitte testet es und gebt mir Feedback.</p>',
      answers: [],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1723381200000,
      message:
        '<h2>ChannelEditPopover Funktion</h2><p>Ich habe eine neue Funktion zum Bearbeiten von Kanälen hinzugefügt. Man kann jetzt direkt im Popover den Kanalnamen und die Beschreibung ändern. Was meint ihr?</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1723382100000,
          message:
            '<p>Das ist eine tolle Ergänzung, Anthony! Macht die Verwaltung von Kanälen viel einfacher. 👌</p>',
        },
      ],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1723467600000,
      message:
        '<p>Ich arbeite gerade an der Implementierung von Push-Benachrichtigungen mit Firebase. Hat jemand Erfahrung damit und kann mir ein paar Tipps geben?</p>',
      answers: [],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1723554000000,
      message:
        '<p>Die Suchfunktion wurde erweitert und unterstützt jetzt auch Fuzzy Search. Probiert es aus und sagt mir, ob es die Benutzererfahrung verbessert! 🕵️‍♂️</p>',
      answers: [
        {
          creatorEmail: 'contact@anthony-hamon.com',
          createdAt: 1723554900000,
          message:
            '<p>Wow, das ist echt cool! Die Suchergebnisse sind jetzt viel intuitiver. Gute Arbeit, Michael!</p>',
        },
      ],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1723640400000,
      message:
        '<h3>WorkSpaceMenu Erweiterung</h3><p>Ich habe eine neue Sektion für Favoriten im WorkSpaceMenu hinzugefügt. Benutzer können jetzt ihre Lieblingskanäle und -kontakte schnell erreichen.</p>',
      answers: [],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1723726800000,
      message:
        '<p>Update zur ChatViewContent: Ich habe die Unterstützung für Code-Snippets mit Syntax-Highlighting implementiert. Perfekt für technische Diskussionen! 💻</p>',
      answers: [
        {
          creatorEmail: 'belaschramm@aol.de',
          createdAt: 1723727700000,
          message:
            '<p>Das ist genau das, was wir gebraucht haben! Großartige Arbeit, Anthony!</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1723813200000,
      message:
        '<p>Ich habe ein Dark Mode Feature implementiert. Es passt sich automatisch den Systemeinstellungen an, kann aber auch manuell umgeschaltet werden. Feedback erwünscht! 🌙</p>',
      answers: [],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1723899600000,
      message:
        '<p>Die Push-Benachrichtigungen sind jetzt einsatzbereit! Sie funktionieren sowohl für Desktop als auch für mobile Geräte. Bitte testet es ausgiebig.</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1723900500000,
          message:
            '<p>Super Arbeit, Bela! Die Benachrichtigungen kommen zuverlässig an und sind nicht aufdringlich. 👍</p>',
        },
      ],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1723986000000,
      message:
        '<h2>Profilanzeige Erweiterung</h2><p>Ich habe die Möglichkeit hinzugefügt, benutzerdefinierte Status-Updates zu setzen. Man kann jetzt einen kurzen Text und ein Emoji als Status festlegen.</p>',
      answers: [],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1724072400000,
      message:
        "<p>Das ThreadView-Component wurde um eine 'Antworten zusammenfalten' Funktion erweitert. Das verbessert die Übersichtlichkeit bei langen Diskussionen.</p>",
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1724073300000,
          message:
            '<p>Sehr nützlich, Peter! Das wird definitiv die Benutzererfahrung verbessern, besonders bei aktiven Threads.</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1724158800000,
      message:
        '<p>Ich habe die Animationen beim Wechsel zwischen verschiedenen Views optimiert. Die App fühlt sich jetzt viel flüssiger an. Was meint ihr? 🎬</p>',
      answers: [],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1724245200000,
      message:
        '<p>Achtung: Es gibt ein kleines Problem mit der Firebase-Authentifizierung bei der Passwort-Zurücksetzung. Ich arbeite daran und werde es bald beheben.</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1724246100000,
          message:
            '<p>Danke für die Info, Bela. Lass mich wissen, wenn du Hilfe brauchst.</p>',
        },
        {
          creatorEmail: 'belaschramm@aol.de',
          createdAt: 1724247000000,
          message:
            '<p>Danke, Peter! Ich melde mich, falls ich nicht weiterkomme.</p>',
        },
      ],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1724331600000,
      message:
        '<h3>Emoji-Reaktionen in ChatViewContent</h3><p>Ich habe Emoji-Reaktionen für Nachrichten implementiert. Benutzer können jetzt schnell auf Nachrichten reagieren, ohne einen Kommentar zu schreiben. 😃👍❤️</p>',
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1724332500000,
          message:
            '<p>Das ist eine tolle Ergänzung, Anthony! Es macht die Interaktion viel lebendiger.</p>',
        },
      ],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1724418000000,
      message:
        '<p>Update zum WorkSpaceMenu: Ich habe eine neue Sortierungsoption hinzugefügt. Benutzer können jetzt Kanäle nach Aktivität oder alphabetisch sortieren.</p>',
      answers: [],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1724504400000,
      message:
        '<p>Gute Nachrichten! Das Problem mit der Passwort-Zurücksetzung ist behoben. Alles funktioniert jetzt wie erwartet. 🎉</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1724505300000,
          message:
            '<p>Super Arbeit, Bela! Schnell und effizient gelöst. 👏</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1724590800000,
      message:
        '<h2>Performance-Optimierung</h2><p>Ich habe einige Verbesserungen an der Gesamtperformance vorgenommen. Die App lädt jetzt etwa 20% schneller. Bitte testet es auf verschiedenen Geräten.</p>',
      answers: [],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1724677200000,
      message:
        '<p>Ich arbeite gerade an einer Vorschau-Funktion für Links in der ChatViewContent. Das sollte das Teilen von Inhalten viel ansprechender machen.</p>',
      answers: [
        {
          creatorEmail: 'peter.kormann1@gmail.com',
          createdAt: 1724678100000,
          message:
            '<p>Das klingt super, Anthony! Kann es kaum erwarten, das zu sehen.</p>',
        },
      ],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1724763600000,
      message:
        '<p>Ich habe die Firebase-Sicherheitsregeln überarbeitet. Wir haben jetzt eine bessere Kontrolle über Lese- und Schreibzugriffe. Könnt ihr das bitte in euren Entwicklungsumgebungen testen?</p>',
      answers: [],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1724850000000,
      message:
        "<h3>Neues Feature im WorkSpaceMenu</h3><p>Ich habe eine 'Kürzlich besucht' Sektion hinzugefügt. Das erleichtert den schnellen Zugriff auf häufig genutzte Kanäle und Chats.</p>",
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1724850900000,
          message:
            '<p>Tolle Idee, Peter! Das wird die Navigation definitiv verbessern. 👍</p>',
        },
      ],
    },
    {
      creatorEmail: 'michael.buschmann.86@gmail.com',
      createdAt: 1724936400000,
      message:
        '<p>Ich habe die Suchfunktion um Filtermöglichkeiten erweitert. Man kann jetzt nach Datum, Benutzer und Kanaltyp filtern. Testet es bitte ausgiebig!</p>',
      answers: [],
    },
    {
      creatorEmail: 'contact@anthony-hamon.com',
      createdAt: 1725022800000,
      message:
        '<p>Die Link-Vorschau in der ChatViewContent ist jetzt live! 🎉 Sie zeigt Titel, Beschreibung und ein Vorschaubild für geteilte Links an.</p>',
      answers: [
        {
          creatorEmail: 'belaschramm@aol.de',
          createdAt: 1725023700000,
          message:
            '<p>Wow, das sieht fantastisch aus, Anthony! Große Verbesserung für die Benutzererfahrung.</p>',
        },
      ],
    },
    {
      creatorEmail: 'belaschramm@aol.de',
      createdAt: 1725109200000,
      message:
        '<h2>Offline-Modus</h2><p>Ich habe angefangen, einen Offline-Modus zu implementieren. Die App wird jetzt grundlegende Funktionen auch ohne Internetverbindung unterstützen.</p>',
      answers: [],
    },
    {
      creatorEmail: 'peter.kormann1@gmail.com',
      createdAt: 1725195600000,
      message:
        "<p>Update zum ThreadView: Ich habe eine 'Springe zum neuesten' Funktion hinzugefügt für lange Threads. Das erleichtert die Navigation in aktiven Diskussionen.</p>",
      answers: [
        {
          creatorEmail: 'michael.buschmann.86@gmail.com',
          createdAt: 1725196500000,
          message:
            '<p>Sehr nützlich, Peter! Besonders für Threads mit vielen neuen Nachrichten.</p>',
        },
      ],
    },
  ];

  async addUsers() {
    this.users.forEach(async (user) => {
      const userExists = this.userService.users.find(
        (u) => u.email === user.email
      )
        ? true
        : false;
      if (userExists === false) {
        await addDoc(collection(this.firestore, '/users'), {
          name: user.name,
          email: user.email,
          online: false,
          signupAt: serverTimestamp(),
          avatar: user.avatar,
        });
      }
    });
  }

  injectFrontEndMessages() {
    const frontendChannel = this.channelService.channels.find(
      (channel) => channel.id === 'dOo9k5RPlepMmo6ITTA1'
    );
    if (!frontendChannel) {
      console.error('Frontend channel not found');
      return;
    }
    this.frontendmessages.forEach(async (message) => {
      const messageID = await this.addMessage(
        frontendChannel.channelMessagesPath,
        'channels/' + frontendChannel.id,
        message,
        false
      );
      if (messageID !== '' && message.answers && message.answers.length > 0) {
        message.answers.forEach(async (answer) => {
          await this.addMessage(
            frontendChannel.channelMessagesPath + messageID + '/answers',
            frontendChannel.channelMessagesPath + messageID,
            answer,
            true
          );
        });
      }
    });
  }

  async addMessage(
    messagesPath: string,
    objectPath: string,
    messageData: MessageData,
    isAnswer: boolean
  ): Promise<string> {
    const creatorID = this.userService.users.find(
      (user) => user.email === messageData.creatorEmail
    )?.id;
    if (creatorID) {
      return await this.addDefaultMessageToCollection(
        messagesPath,
        objectPath,
        messageData.message,
        creatorID,
        this.getMessageDate(messageData.createdAt),
        isAnswer
      );
    }
    return '';
  }

  getMessageDate(createdAt: number): Date {
    const messageDate = new Date();
    messageDate.setTime(+createdAt);
    return messageDate;
  }

  async addDefaultMessageToCollection(
    messagePath: string,
    objectPath: string,
    messageContent: string,
    creatorID: string = this.userService.currentUserID,
    createdAt: Date | undefined = undefined,
    answer: boolean = false
  ): Promise<string> {
    try {
      const messageCollectionRef = collection(this.firestore, messagePath);
      if (!messageCollectionRef)
        throw new Error(
          'Nachrichtenpfad "' + messagePath + '" nicht gefunden.'
        );
      const response = await addDoc(
        messageCollectionRef,
        this.createNewMessageObject(
          messageContent,
          !answer,
          creatorID,
          createdAt
        )
      );
      const messagesQuerySnapshot = await getDocs(messageCollectionRef);
      const updateData = answer
        ? {
            answerCount: messagesQuerySnapshot.size,
            lastAnswerAt: serverTimestamp(),
          }
        : { messagesCount: messagesQuerySnapshot.size };
      await updateDoc(doc(this.firestore, objectPath), updateData);
      return response.id;
    } catch (error) {
      console.error('DefaultMessageAdd: error adding message', error);
      return '';
    }
  }

  private createNewMessageObject(
    messageText: string,
    answerable: boolean,
    createdBy: string,
    createdAt: Date | undefined
  ): any {
    return {
      creatorID: createdBy,
      createdAt: createdAt ? createdAt : serverTimestamp(),
      content: messageText,
      plainContent: removeAllHTMLTagsFromString(messageText),
      emojies: [],
      answerable: answerable,
    };
  }
}
