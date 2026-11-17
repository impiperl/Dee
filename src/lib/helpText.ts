import type { Lang } from './i18n';

/** One block of the help page: text, then commands to type on the server, then links. */
export interface HelpStep {
  title: string;
  text: string;
  commands?: string[];
  links?: { label: string; url: string }[];
  after?: string;
  /** Shows the "add server" button. */
  pairButton?: boolean;
}

export interface HelpText {
  title: string;
  intro: string;
  steps: HelpStep[];
  troubleTitle: string;
  trouble: { problem: string; fix: string; commands?: string[] }[];
  note: string;
}

const repo = { label: 'github.com/impiperl/Tweedle', url: 'https://github.com/impiperl/Tweedle' };

const de: HelpText = {
  title: 'So kommst du zum Server',
  intro:
    'Dee spricht nicht direkt mit dem Server, sondern mit Tweedle, einem kleinen Programm, das dort als Dienst läuft. ' +
    'Tweedle läuft auf Linux mit systemd.',
  steps: [
    {
      title: '1. Tweedle auf dem Server installieren',
      text:
        'Programm holen (braucht Go 1.22 oder neuer), bauen und einrichten. Der Installer fragt nach dem Namen des Servers, wie die App ihn erreicht ' +
        '(über einen Webserver, der dort schon läuft, direkt per HTTPS oder ohne Verschlüsselung im Heimnetz) ' +
        'und welche Prozesse und Container überwacht werden sollen. Enter übernimmt jeweils den Vorschlag.',
      links: [repo],
      commands: [
        'git clone https://github.com/impiperl/Tweedle && cd Tweedle',
        'CGO_ENABLED=0 go build -o tweedle ./cmd/tweedle',
        'sudo ./tweedle install',
      ],
      after:
        'Läuft ein Webserver, zeigt der Installer am Ende die Zeilen für nginx, Apache oder Caddy, die du dort einträgst. ' +
        'Später ändern: einfach noch einmal „sudo tweedle install“.',
    },
    {
      title: '2. Prüfen, ob der Server erreichbar ist',
      text: 'Die Adresse, die der Installer am Ende anzeigt, mit /health dahinter im Browser auf dem Handy öffnen, zum Beispiel:',
      commands: ['https://example.com/tweedle/health'],
      after: 'Es muss eine Antwort mit "ok":true kommen.',
    },
    {
      title: '3. Koppeln',
      text: 'Auf dem Server einen Code erzeugen. Er gilt 10 Minuten und nur einmal.',
      commands: ['sudo tweedle pair'],
      after:
        'Dann in Dee „Server hinzufügen“ tippen und den QR-Code scannen. Ohne Kamera: „Code eingeben“, die Adresse und den Code abtippen.',
      pairButton: true,
    },
    {
      title: '4. Zwei Server überwachen sich gegenseitig',
      text:
        'Tweedle auf beiden Servern installieren und bei der Frage nach anderen Servern jeweils die Adresse des anderen eingeben. ' +
        'Fällt einer aus, meldet ihn der andere. Dee mit beiden Servern koppeln.',
    },
  ],
  troubleTitle: 'Wenn es nicht klappt',
  trouble: [
    {
      problem: '„Nicht erreichbar“',
      fix:
        'Die Adresse aus Schritt 2 im Browser testen. Kommt dort nichts, läuft Tweedle nicht, der Webserver leitet nicht weiter ' +
        'oder die Firewall sperrt den Port. Auf dem Server:',
      commands: ['sudo systemctl status tweedle', 'sudo journalctl -u tweedle -n 30'],
    },
    {
      problem: '„Code ungültig oder abgelaufen“',
      fix: 'Mit „tweedle pair“ einen neuen Code erzeugen; jeder Code geht nur einmal.',
    },
    {
      problem: '„Nicht mehr gekoppelt“',
      fix: 'Das Gerät wurde auf dem Server entfernt. In Dee neu koppeln. Gekoppelte Geräte zeigen und entfernen:',
      commands: ['sudo tweedle devices', 'sudo tweedle devices rm ID'],
    },
    {
      problem: 'Keine Push-Nachrichten',
      fix: 'Push für Dee in den Systemeinstellungen erlauben und unter Einstellungen die Stufe prüfen. Testnachricht an alle Geräte:',
      commands: ['sudo tweedle testpush'],
    },
  ],
  note: 'Findet sudo „tweedle“ nicht (z. B. auf RHEL), den vollen Pfad nehmen: sudo /usr/local/bin/tweedle …',
};

const en: HelpText = {
  title: 'How to reach a server',
  intro:
    'Dee does not talk to the server directly but to Tweedle, a small program running there as a service. ' +
    'Tweedle runs on Linux with systemd.',
  steps: [
    {
      title: '1. Install Tweedle on the server',
      text:
        'Get the program (needs Go 1.22 or newer), build and set it up. The installer asks for the name of the server, how the app reaches it ' +
        '(through a web server already running there, directly over HTTPS, or without encryption on a home network) ' +
        'and which processes and containers to watch. Enter takes the suggestion.',
      links: [repo],
      commands: [
        'git clone https://github.com/impiperl/Tweedle && cd Tweedle',
        'CGO_ENABLED=0 go build -o tweedle ./cmd/tweedle',
        'sudo ./tweedle install',
      ],
      after:
        'With a web server, the installer finally shows the lines to add for nginx, Apache or Caddy. ' +
        'To change settings later, just run “sudo tweedle install” again.',
    },
    {
      title: '2. Check that the server is reachable',
      text: 'Open the address the installer shows at the end, with /health added, in the browser on the phone, for example:',
      commands: ['https://example.com/tweedle/health'],
      after: 'The answer must contain "ok":true.',
    },
    {
      title: '3. Pair',
      text: 'Create a code on the server. It is valid for 10 minutes and only once.',
      commands: ['sudo tweedle pair'],
      after: 'Then tap “Add server” in Dee and scan the QR code. Without a camera: “Enter code”, type the address and the code.',
      pairButton: true,
    },
    {
      title: '4. Two servers watching each other',
      text:
        'Install Tweedle on both servers and, when asked for other servers, enter the address of the other one. ' +
        'If one fails, the other reports it. Pair Dee with both servers.',
    },
  ],
  troubleTitle: 'If it does not work',
  trouble: [
    {
      problem: '“Unreachable”',
      fix:
        'Test the address from step 2 in the browser. If nothing comes back, Tweedle is not running, the web server does not ' +
        'forward, or the firewall blocks the port. On the server:',
      commands: ['sudo systemctl status tweedle', 'sudo journalctl -u tweedle -n 30'],
    },
    {
      problem: '“Code invalid or expired”',
      fix: 'Create a new code with “tweedle pair”; each code works only once.',
    },
    {
      problem: '“No longer paired”',
      fix: 'The device was removed on the server. Pair again in Dee. List and remove paired devices:',
      commands: ['sudo tweedle devices', 'sudo tweedle devices rm ID'],
    },
    {
      problem: 'No push notifications',
      fix: 'Allow push for Dee in the system settings and check the level under Settings. Test message to all devices:',
      commands: ['sudo tweedle testpush'],
    },
  ],
  note: 'If sudo cannot find “tweedle” (e.g. on RHEL), use the full path: sudo /usr/local/bin/tweedle …',
};

export const helpText: Record<Lang, HelpText> = { de, en };
