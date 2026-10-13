# Dávkování léků

Kalkulačka dávek léků na horečku a bolest u dětí podle hmotnosti. Vychází z
[kalkulačky ordinace Pediatrie Revoluční](https://www.pediatrie-revolucni.cz/cs/kalkulacka-davkovani-leku-na-snizeni-teploty).

Aplikace je napsaná v React Native (Expo) a ze stejného kódu běží na Androidu i na webu.
Původní jednostránková verze zůstává v `legacy/index.html`.

## Spuštění

```bash
npm install
npm run web        # web na http://localhost:8081
npm run android    # sestaví a spustí aplikaci v emulátoru nebo na připojeném telefonu
```

## Sestavení

```bash
npm run build:web  # statický web do složky dist/
npm run build:apk  # APK do android/app/build/outputs/apk/release/
```

Složka `android/` se generuje z `app.json` příkazem `expo prebuild` a do gitu nepatří.
APK z `build:apk` je podepsané vývojovým klíčem – hodí se k instalaci do vlastního telefonu,
pro Google Play je potřeba vlastní podpisový klíč (například přes EAS Build).

## Kde co je

- `src/data/medicines.ts` – účinné látky, značky a přípravky
- `src/lib/dosage.ts` – výpočet dávky; testy v `dosage.test.ts` (`npm test`)
- `src/components/` – pole pro hmotnost, řádek léku, detail dávky
- `assets/source/` – SVG předlohy ikon

Před úpravou výpočtu nebo seznamu léků spusťte `npm test` a `npm run typecheck`.
