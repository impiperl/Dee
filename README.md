# Dee

Expo app (en/de) for the Tweedle monitoring agent
([github.com/impiperl/Tweedle](https://github.com/impiperl/Tweedle)). Shows the
state of one or more servers, the history and the events, and receives the
push messages. Privacy policy: [PRIVACY.md](PRIVACY.md).

```bash
npm install
npx expo start          # needs a development build (camera, push)
npx tsc --noEmit        # typecheck
npx expo lint
```

## Structure

| Path | |
|---|---|
| `src/app/(tabs)/index.tsx` | overview: meters, disks, reachability, processes, containers, certificates, history |
| `src/app/(tabs)/events.tsx` | events of the active server, filter, marks them seen |
| `src/app/(tabs)/settings.tsx` | servers, push level per server, language, privacy link |
| `src/app/pair.tsx` | pairing by QR code (`tweedle pair`) or by address + code |
| `src/app/help.tsx` | how to install Tweedle and pair (texts in `src/lib/helpText.ts`) |
| `src/lib/api.ts` | Tweedle API client |
| `src/lib/servers.tsx` | paired servers (with tokens) in the secure store |
| `src/lib/live.tsx` | status of the active server: WebSocket `/api/live`, falls back to polling |
| `src/lib/pushSync.tsx` | push token, keeps servers informed, opens events on tap |
| `src/lib/i18n.tsx` | app texts de/en; event texts come from Tweedle in the device language |

## Build (EAS)

1. `npx eas-cli@latest init` – creates the EAS project and writes `extra.eas.projectId`
   into `app.json` (push needs it).
2. Android push: add an Android app `com.impi.dee` in Firebase and put its
   `google-services.json` into the project root (`app.json` points to it; the
   Android build fails without it). It is in `.gitignore` (public repo) but not
   in `.easignore`, so EAS uploads it from the local checkout. Upload the FCM V1 service account key with
   `npx eas-cli@latest credentials`.
3. iOS push: EAS creates the APNs key during the first iOS build
   (`npx eas-cli@latest credentials` otherwise). The app asks for the
   time-sensitive notifications entitlement (error messages).
4. `npx eas-cli@latest build --profile development --platform all`
   (`production` for the stores).

Servers without encryption (home network) use plain HTTP: allowed by
`usesCleartextTraffic` (Android) and `NSAllowsLocalNetworking` (iOS, local
addresses only).
