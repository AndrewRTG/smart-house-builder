# Ghid PostgreSQL DataBase

Hello, guys!

Database-ul nostru e up and running in AWS. Ghidul asta o sa va arate cum sa va conectati la conturile voastre de AWS si cum sa va conectati la database in IntelliJ.

## Conectare la AWS

First of all, va trebui sa va extrageti din `AWS_credentials.zip` fisierul .csv corespunzator voua. Il puteti deschide prin Excel. Pe celula de pe *coloana 1, randul 2* va veti gasi username-ul parola si link-ul catre pagina de logare pentru AWS, separate prin virgule (`,`).

![poza exemplu csv](https://i.imgur.com/2jmT50j.png)

Intrati pe link-ul de logare si introduceti user-ul si parola si **bifati "Remember this account"**

![poza exemplu first login](https://i.imgur.com/e4p3gao.png)

O sa trebuiasca sa va puneti o parola noua

![poza parola noua](https://i.imgur.com/qGDIsJ2.png)

Odata ce ati pus o noua parola contului vostru, continuati si logati-va in AWS utilizand user-ul si noua parola. Daca veti primi **404**, atunci puteti reaccesa pagina de login utilizand acelasi link din fisierul .csv. Daca este cazul ,**bifati "Remember this account"**.

Acum ar trebui sa puteti vedea consola principala.
***‼️ASIGURATI-VA CA REGIUNEA ESTE EUROPE(STOCKHOLM) DIN MENIUL DIN DREAPTA SUS‼️***

![poza main console aws](https://i.imgur.com/zlhRCMe.png)

Congrats! Aveti cont pe AWS! De aici o sa va luati credentialele pentru conectarea la database.

## Conectarea la PostgreSQL DataBase in IntelliJ

Din moment ce s-a decis ca vom lucra in springboot si presupun ca **NIMENI** nu foloseste netbeans sau alt IDE inafara de IntelliJ, am sa fac un mic tutorial cum sa va conectati la database din IntelliJ.

First of all, cautati in consola AWS termenul `RDS` si intrati pe pagina respectiva. Ar trebui sa vedeti o consola in genul asta:

![poza RDS console](https://i.imgur.com/wm7CDbo.png)

Aici, selectati `1` de sub `DB instances`. Apoi selectati `database-1-instance-1`. Ar trebui sa vedeti urmatoarea consola:

![poza db instance console](https://i.imgur.com/yF3f1L8.png)

Selectati endpoints si dati scroll down ca sa vedeti toate datele necesare realizarii conexiunii la database.

![poza endpoints](https://i.imgur.com/OMvCyPm.png)

Ok, in browser ramaneti pe pagina asta si, mai departe, deschideti IntelliJ in proiectul spring de pe github (daca nu ati facut-o deja, clonati-va repo-ul sau dati `Fetch Origin` pentru a avea proiectul spring boot pe PC).

In folderul `resources`, creati un folder nou denumit `application-dev.properties`.

![poza fisier nou](https://i.imgur.com/4pqnOFW.png)

In sidebar-ul de pe partea dreapta, veti gasi urmatorul simbol: ![simbol database](https://i.imgur.com/Voku861.png).

Dati click pe el si veti vedea meniul `Databases`. Aici, dati click pe `+` si, de la `Data Sources` selectati `PostgreSQL`.

![poza postgresql](https://i.imgur.com/QfTH5Wm.png)

In meniul care v-a aparut, o sa completati `host` cu `Endpoint` de pe AWS, `user` cu `postgres`, iar pentru parola veti da click pe `Get Token` de sub `IAM Authentication Token`. Dati copy la ce v-a aparut si puneti-l in campul `password` din IntelliJ.

![poza iam auth token](https://i.imgur.com/hWXxa96.png)

Odata ce ati completat toate datele, puteti testa daca se poate realiza conexiunea la serverul bazei de date apasand pe `Test Connection`. Daca totul este in regula, ar trebui sa primiti inapoi mesajul `Succeeded`.

![poza succes](https://i.imgur.com/FaUo6sk.png)

Acum puteti da `Apply` si apoi `OK`.

Intrati in fisierul `application-dev.properties` si dati drag'n'drop la conexiunea pe care ati facut-o, din meniul Database din partea dreapta.

![poza postgresql](https://i.imgur.com/iK5P9aH.png)

Campul password nu va avea nimic dupa `=`. Trebuie sa dati din nou paste la parola pe care ati copiat-o de pe AWS.

Pentru a testa daca totul este in regula, puteti da run la aplicatia spring. Daca totul este ok, in consola ultima linie ar trebui sa fie `Started SmartHouseBuilderApplication in ...`.

## IMPORTANT

Utilizati baza de date cu mare atentie! Avem un numar limitat de credite. Daca le terminam, va trebui ca tot procesul in AWS sa fie refacut atat de voi pentru obtinerea accesului, cat si de mine pentru restabilirea unei baze de date stabila si functionala. Daca nu planuiti sa lucrati la proiect, nu tineti deschisa fereastra IntelliJ sau dezactivati conexiunea apasand pe patratul mic si rosu din meniul Database, cu conexiunea catre Smart House Builder selectata.

De asemenea, parola fiecarui utilizator AWS se reseteaza odata la 15 minute. Daca restartati aplicatia spring, va trebui sa faceti rost de un nou `IAM Authentication Token` pe care sa il introduceti in `application-dev.properties` in campul password, in locul vechii parole. Va veti da seama daca v-a expirat parola daca cand dati run, aplicatia spring nu ramane pornita si in schimb programul se termina cu exit code **1**.

‼️***ABSOLUT INTERZIS CA DATELE DE CONECTARE CATRE DATABASE SA APARA IN `application.properties.`***‼️