# Anleitung für das Schreiben von Tests für EmpowHR

## Vorraussetzungen
Node (benutzt wurde v22.20.0)

NPM (benutzt wurde v11.6.2)

PgAdmin https://www.pgadmin.org/ 

Visual Studio Code


## Einrichtung

1. Installiere die benötigten Pakete mit `npm install`.
2. Starte das Backend mit `npm run dev`.
3. In PgAdmin muss eine Servergruppe > Server > Datenbank exisiteren. Die Datenbank muss den selben Namen haben, der in der .env.test hinterlegt ist. Siehe Screenshot
3. Folge dem Link, welcher in der Konsole angezeigt wird => |--- localhost:3000/api-docs ---| 
4. Dort sind Routen hinterlegt, welche einen Swagger Dokumentationskommentar besitzen.

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
