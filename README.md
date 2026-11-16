# Dee

Expo app (en/de) for the Tweedle monitoring agent
([github.com/impiperl/Tweedle](https://github.com/impiperl/Tweedle)). Shows the
state of one or more servers, the history and the events, and receives the
push messages. Plan: wiki, Tools → "Tweedle & Dee (Monitoring)".

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
| `src/app/(tabs)/settings.tsx` | servers, push level per server, language |
| `src/app/pair.tsx` | pairing by QR code (`tweedle pair`) or by address + code |
| `src/lib/api.ts` | Tweedle API client |
| `src/lib/servers.tsx` | paired servers (with tokens) in the secure store |
| `src/lib/live.tsx` | status of the active server: WebSocket `/api/live`, falls back to polling |
| `src/lib/pushSync.tsx` | push token, keeps servers informed, opens events on tap |
| `src/lib/i18n.tsx` | app texts de/en; event texts come from Tweedle in the device language |

## Build (EAS)

1. `npx eas-cli@latest init` – creates the EAS project and writes `extra.eas.projectId`
   into `app.json` (push needs it).
2. Android push: add an Android app `com.impi.dee` in Firebase, put
   `google-services.json` into the project root and add
   `"googleServicesFile": "./google-services.json"` under `android` in `app.json`;
   upload the FCM V1 service account key with `npx eas-cli@latest credentials`.
3. iOS push: EAS creates the APNs key during the first iOS build
   (`npx eas-cli@latest credentials` otherwise). The app asks for the
   time-sensitive notifications entitlement (error messages).
4. `npx eas-cli@latest build --profile development --platform all`

Dev (`http://192.168.0.115/mon`) is plain HTTP: allowed by
`usesCleartextTraffic` (Android) and `NSAllowsLocalNetworking` (iOS).
