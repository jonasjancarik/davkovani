# Dávkování léků

Kalkulačka dávek léků na horečku a bolest u dětí podle hmotnosti. Vychází z
[kalkulačky ordinace Pediatrie Revoluční](https://www.pediatrie-revolucni.cz/cs/kalkulacka-davkovani-leku-na-snizeni-teploty).

Aplikace je napsaná v React Native (Expo) a ze stejného kódu běží na Androidu i na webu.
Původní jednostránková verze zůstává v `legacy/index.html`.

## Dva způsoby dávkování

Přepínač na hlavní obrazovce platí pro celou aplikaci.

- **Podle letáku** (výchozí) – tabulky z příbalových informací jednotlivých přípravků v databázi
  SÚKL. Přepis je v `src/data/leaflets.ts` i s kódem SÚKL a označením dokumentu; po aktualizaci
  letáku je potřeba ho zkontrolovat. Hmotnost mezi dvěma pásmy letáku se řadí do nižšího pásma.
- **Podle pediatrů** – vyšší dávky z kalkulačky Pediatrie Revoluční: ibuprofen 10 mg/kg,
  paracetamol 15 mg/kg.

Dvě místa nejsou doslovný přepis letáku: Nurofen 20 mg/ml udává jen denní dávku 20–30 mg/kg,
kterou aplikace dělí do 3 dávek, a Ibalgin 200 dávkuje děti jen podle věku (6–12 let), takže
hmotnost 20–40 kg je převzatá z tabulky v letáku Ibalgin Baby.

## Děti

Lze uložit víc dětí; každé má vlastní hmotnost a vlastní deníček. Bez uloženého dítěte aplikace
funguje také, jen se hmotnost po zavření nepamatuje.

## Deníček dávek

Podanou dávku lze z detailu léku zapsat do deníčku. Aplikace pak u obou účinných látek ukazuje,
kdy je lze podat znovu. Hlídá odstup od poslední dávky stejné látky, denní maximum za posledních
24 hodin a 4 hodiny od dávky druhé látky. Odstup a maximum se berou z naposledy podaného léku:
podle pediatrů je to 8 hodin a 3× denně u ibuprofenu a 6 hodin a 4× denně u paracetamolu, podle
letáku 6 hodin a tolikrát denně, kolik leták pro danou hmotnost dovoluje. Záznamy zůstávají jen v zařízení a po 7 dnech se samy odmažou.

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
- `src/data/leaflets.ts` – dávkovací tabulky z příbalových letáků
- `src/lib/useSettings.ts` – uložené děti a zvolený způsob dávkování
- `src/lib/dosage.ts` – výpočet dávky; testy v `dosage.test.ts` (`npm test`)
- `src/lib/diary.ts` – deníček dávek a pravidla pro čas další dávky; ukládání v `useDiary.ts`
- `src/components/` – pole pro hmotnost, řádek léku, detail dávky
- `assets/source/` – SVG předlohy ikon

Před úpravou výpočtu nebo seznamu léků spusťte `npm test` a `npm run typecheck`.
