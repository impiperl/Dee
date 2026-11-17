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

const health = [
  { label: 'Prod  https://gaistnet.com/mon/health', url: 'https://gaistnet.com/mon/health' },
  { label: 'Dev  http://192.168.0.115/mon/health', url: 'http://192.168.0.115/mon/health' },
];

const de: HelpText = {
  title: 'So kommst du zum Server',
  intro:
    'Dee spricht nicht direkt mit dem Server, sondern mit Tweedle, einem kleinen Programm, das dort als Dienst läuft. ' +
    'Die App erreicht Tweedle über nginx unter /mon/ – auf Prod per HTTPS, auf Dev nur im Heimnetz.',
  steps: [
    {
      title: '1. Tweedle auf dem Server installieren',
      text:
        'Einmal pro Server, im Tweedle-Repo. Das Skript baut Tweedle, richtet den Dienst ein und trägt /mon/ in nginx ein. ' +
        'Beim ersten Lauf legt es nur die Config an: dann „setup“ ausführen (auswählen, was überwacht wird) und das Skript noch einmal starten.',
      commands: [
        'git pull',
        'sudo deploy/install.sh prod      # bzw. dev',
        'sudo /usr/local/bin/tweedle setup',
        'sudo deploy/install.sh prod',
      ],
    },
    {
      title: '2. Prüfen, ob /mon/ erreichbar ist',
      text: 'Im Browser auf dem Handy öffnen. Es muss eine Antwort mit "ok":true kommen.',
      links: health,
      after: 'Dev geht nur, wenn das Handy im Heimnetz (WLAN) ist.',
    },
    {
      title: '3. Koppeln',
      text: 'Auf dem Server einen Code erzeugen. Er gilt 10 Minuten und nur einmal.',
      commands: ['sudo /usr/local/bin/tweedle pair'],
      after:
        'Dann in Dee „Server hinzufügen“ tippen und den QR-Code scannen. Ohne Kamera: „Code eingeben“, Adresse wählen (Prod/Dev) und den Code abtippen.',
      pairButton: true,
    },
  ],
  troubleTitle: 'Wenn es nicht klappt',
  trouble: [
    {
      problem: '„Nicht erreichbar“',
      fix: 'Die Adresse aus Schritt 2 im Browser testen. Kommt dort nichts, läuft Tweedle nicht oder nginx leitet /mon/ nicht weiter:',
      commands: ['sudo systemctl status tweedle', 'sudo journalctl -u tweedle -n 30'],
    },
    {
      problem: '„Code ungültig oder abgelaufen“',
      fix: 'Mit „tweedle pair“ einen neuen Code erzeugen; jeder Code geht nur einmal.',
    },
    {
      problem: '„Nicht mehr gekoppelt“',
      fix: 'Das Gerät wurde auf dem Server entfernt. In Dee neu koppeln. Gekoppelte Geräte zeigen und entfernen:',
      commands: ['sudo /usr/local/bin/tweedle devices', 'sudo /usr/local/bin/tweedle devices rm ID'],
    },
    {
      problem: 'Keine Push-Nachrichten',
      fix: 'Push für Dee in den Systemeinstellungen erlauben und unter Einstellungen die Stufe prüfen. Testnachricht an alle Geräte:',
      commands: ['sudo /usr/local/bin/tweedle testpush'],
    },
  ],
  note: 'sudo findet auf RHEL /usr/local/bin nicht, deshalb der volle Pfad.',
};

const en: HelpText = {
  title: 'How to reach a server',
  intro:
    'Dee does not talk to the server directly but to Tweedle, a small program running there as a service. ' +
    'The app reaches Tweedle through nginx under /mon/ – on Prod over HTTPS, on Dev only from the home network.',
  steps: [
    {
      title: '1. Install Tweedle on the server',
      text:
        'Once per server, in the Tweedle repo. The script builds Tweedle, sets up the service and adds /mon/ to nginx. ' +
        'The first run only creates the config: then run “setup” (choose what to watch) and start the script again.',
      commands: [
        'git pull',
        'sudo deploy/install.sh prod      # or dev',
        'sudo /usr/local/bin/tweedle setup',
        'sudo deploy/install.sh prod',
      ],
    },
    {
      title: '2. Check that /mon/ is reachable',
      text: 'Open it in the browser on the phone. The answer must contain "ok":true.',
      links: health,
      after: 'Dev only works while the phone is on the home network (Wi-Fi).',
    },
    {
      title: '3. Pair',
      text: 'Create a code on the server. It is valid for 10 minutes and only once.',
      commands: ['sudo /usr/local/bin/tweedle pair'],
      after:
        'Then tap “Add server” in Dee and scan the QR code. Without a camera: “Enter code”, choose the address (Prod/Dev) and type the code.',
      pairButton: true,
    },
  ],
  troubleTitle: 'If it does not work',
  trouble: [
    {
      problem: '“Unreachable”',
      fix: 'Test the address from step 2 in the browser. If nothing comes back, Tweedle is not running or nginx does not forward /mon/:',
      commands: ['sudo systemctl status tweedle', 'sudo journalctl -u tweedle -n 30'],
    },
    {
      problem: '“Code invalid or expired”',
      fix: 'Create a new code with “tweedle pair”; each code works only once.',
    },
    {
      problem: '“No longer paired”',
      fix: 'The device was removed on the server. Pair again in Dee. List and remove paired devices:',
      commands: ['sudo /usr/local/bin/tweedle devices', 'sudo /usr/local/bin/tweedle devices rm ID'],
    },
    {
      problem: 'No push notifications',
      fix: 'Allow push for Dee in the system settings and check the level under Settings. Test message to all devices:',
      commands: ['sudo /usr/local/bin/tweedle testpush'],
    },
  ],
  note: 'sudo on RHEL does not search /usr/local/bin, hence the full path.',
};

export const helpText: Record<Lang, HelpText> = { de, en };
