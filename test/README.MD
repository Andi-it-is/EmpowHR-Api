# Anleitung für das Schreiben von Tests für EmpowHR

## Vorraussetzungen
Node (benutzt wurde v22.20.0)

NPM (benutzt wurde v11.6.2)

PgAdmin https://www.pgadmin.org/ 

Visual Studio Code

## Präambel

Ich werde iterativ neue Issues erstellen, und aus diesen Issues neue Branches erzeugen.
Die Branches sind nummeriert, so wie `1-test-ready-api-iteration-1`.

## Einrichtung

1. Feature Branch auswählen.
2. Code auswählen
3. URL Kopieren

   ![Link aus Github einfügen](./assets/image-01.png)

4. In windows ein neues Terminal öffnen
5. In dein gewünschtes Verzeichnis navigieren
6. Den Befehl `git clone URL_DIE_DU_KOPIERT_HAST` eingeben und mit Enter bestätigen

   ![Windows Terminal öffnen und Projekt clonen](./assets/image-02.png)

7. Öffne Das Projekt in Visual Studio Code (Ordner auswählen)

   ![Ordner öffnen](./assets/image-03.png)

8. Erstelle ein Terminal

   ![Terminal öffnen](./assets/image-04.png)

9. Im Terminal: Installiere die benötigten Pakete mit `npm install`.
10. Starte das Backend mit `npm run dev`.
11. Jetzt solltest du Fehler bekommen

12. In PgAdmin muss eine Servergruppe > Server > Datenbank exisiteren. Die Datenbank muss den selben Namen haben, der in der Datei `.env.test` unter `DB_NAME` hinterlegt ist.

    ![Pg Admin öffnen und Server Gruppe erstellen](./assets/image-05.png)

    ![Name eingeben](./assets/image-06.png)

13. localhost und Das Password `postgres` eingeben.
14. Ändere bei dir in der `.env.test` das `DB_PASS` auch zu `postgres`.

    ![Host und Password eingeben](./assets/image-07.png)

15. Speichern und erstellen

    ![Datenbank auswählen](./assets/image-08.png)

16. Unter `Servers > test_empowhr_test > Databases > test_empowhr_test > Schemas > public > Tables` findest du die Tabellen der Datenbank.
17. Mit Rechstklick auf `public` kannst du `ERD for Schema` dir anzeigen lassen.
18. DB ist fertig, dein Backend dürfte nicht mehr abstürzen. Speicher und neu starten.

19. Folge dem Link, welcher in der Konsole angezeigt wird `localhost:3000/api-docs`. Oder gebe den in deinen Browser des Vertrauens ein.

    ![Swagger Link folgen](./assets/image-09.png)

20. Dort sind Routen hinterlegt, welche einen Swagger Dokumentationskommentar besitzen. Da werden die Routen erklärt.

    ![Swagger](./assets/image-10.png)

## Auftrag

Die Routen können mit verschiedenen Statuscodes antworten. Wir machen Äquivalenzklassentests. 
Für jeden Statuscode den eine Route haben kann, wird ein Test geschrieben. 
Falls Routen komplexer sind und es mehrere Wege gibt einen bestimmten Fehlercode zu erreichen, so sollen mehrere Tests für den Fall geschrieben werden.

## Vorgang

1. Factory bauen. In /test/factories sind Fabriken von der Entitäten. Das sind quasi vorausgefüllte Initialisierungen einer solchen Enität (siehe /src/entity).
2. Route bauen. In /test/routes/{variable} sind die Routen hinterlegt. Die Struktur ist die selbe, wie bei der offiziellen API (siehe /src/api/v1).
3. Test schreiben :D
4. Tests ausführen mit ``` npm run test ``` 


## Hilfreiches im Aufbau der "Testanfrage"

```

const res = await request(app)
  .post("/api/v1/route/:param")               // HTTP-Methode + URL (params direkt in die URL)
  .set("Authorization", `Bearer ${token}`)    // req.headers
  .query({ page: 1, limit: 10 })              // req.query  → ?page=1&limit=10
  .send({ key: "value" })                     // req.body

``` 

```

request(app).get("/route")      // GET    → kein .send() (Get Routen besitzen kein Body)
request(app).post("/route")     // POST
request(app).put("/route")      // PUT
request(app).patch("/route")    // PATCH
request(app).delete("/route")   // DELETE → kein .send() (Delete Routen besitzen kein Body)

```
