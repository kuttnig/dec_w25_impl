## B2B‑3: Batch‑Synchronisation von Angeboten (Offer Sync Batch)

### Zweck/Ziel

Ein Unternehmen (Seller) synchronisiert Angebote (Offers) batchweise mit marktverbund25.at, damit Preise/Verfügbarkeit im Marketplace aktuell bleiben.

**B2B‑Merkmale:** Authentifizierung + Batch‑Fähigkeit. 

### Kurzbeschreibung

Das Business‑System sendet einen Offer‑Sync‑Batch mit mehreren “Items” (z.B. UPSERT/REMOVE). Die Plattform bestätigt die Annahme (ACK) sofort, verarbeitet den Batch asynchron und stellt später Status + Ergebnisprotokoll (inkl. Fehler pro Item) bereit.
Damit umfasst der Use Case folgende states: (Submit → Status → Result). 

### Vorbedingungen

* Business‑Client besitzt gültige **B2B Authentifizierung** (API Key). 
* Der Business‑User ist als “Unternehmen” registriert (`isBusiness = true`).
* Produkte existieren im Katalog.
* Optional (für zb. Updates oder Remove aktionen): Das System kann bestehende Offers eines Produkts abfragen.

### Schritte / Aktivitäten

1. **Authentifizieren** (B2B API Key mitsenden `"b2bApiKey": "b2b_raphael_456"`).
2. **Produktliste abfragen** (für Mapping → `productId`).
3. Optional: **Offers für ein Produkt abfragen** (um `offerId` für Update/Remove zu kennen).
4. **Offer Sync Batch submitten** (`submitOfferSyncBatch`) mit mehreren Items.

   * System antwortet sofort mit `batchId` und Status `ACCEPTED`.
5. **Batch‑Status pollen** (`offerSyncBatchStatus(batchId)`) bis `DONE` oder `FAILED`.
6. **Batch‑Ergebnis abrufen** (`offerSyncBatchResult(batchId)`):

   * pro Item: `OK|ERROR` + `errorCode` + `message`
7. Optional kann man auch den Zustand verifizieren (z.B. `offers(productId)`).

### Nachbedingungen im Erfolgsfall

* Offers sind erstellt/aktualisiert/entfernt entsprechend Batch‑Items.
* Batch ist protokolliert: Status `DONE`, Summary (processed/success/error).

### Nachbedingungen im Fehlerfall

* Bei Auth‑Fehler: Batch wird nicht angenommen (`UNAUTHORIZED`).
* Bei Validierungsfehlern:

  * Entweder Batch direkt abgelehnt (z.B. leerer Batch, zu groß), oder
  * Partial Success: einzelne Items `ERROR`, Rest `OK`.
* Batch kann Status `FAILED` haben (z.B. DB‑Fehler).

---

## B2B‑4: Sales Report Export (Abrechnung/Reconciliation)

### Zweck/Ziel

Ein Unternehmen fordert für z.B. die Buchhaltung einen **Sales Report** für einen Zeitraum an (z.B. Verkäufe der letzten Woche). Der Report ist für automatisierte Verarbeitung (Batch/Export) gedacht.

**B2B‑Merkmale:** Authentifizierung + asynchroner Export + paginierte Abholung. 

### Kurzbeschreibung

Das Business‑System fordert einen Report an (Request). Die Plattform erzeugt den Report asynchron. Das Business‑System fragt Status ab und lädt Reportdaten paginiert herunter. Optional bestätigt es den Empfang.
Damit umfasst der Use Case folgende states: (Request → Status → Fetch pages → optional Confirm). 

### Vorbedingungen

* Business‑Client besitzt gültige **B2B Authentifizierung**. 
* Es existieren Orders im Zeitraum, die einem Seller zugeordnet werden können.
* Datum/Zeitraum ist gültig (z.B. from ≤ to, max. Range).

### Schritte / Aktivitäten

1. **Authentifizieren** (B2B API Key mitsenden `"b2bApiKey": "b2b_raphael_456"`).
2. **Report anfordern** (`requestSalesReport(from,to,...)`) → Antwort `reportId`, Status `QUEUED`.
3. **Status pollen** (`salesReportStatus(reportId)`) bis `READY` oder `FAILED`.
4. **Reportdaten abrufen** (`salesReport(reportId,page,pageSize)`) – mehrfach (Pagination).
5. Optional: **Empfang bestätigen** (`confirmSalesReportReceived(reportId)`).

### Nachbedingungen im Erfolgsfall

* Report ist erzeugt (`READY`) und kann paginiert gelesen werden.
* Optional: “receivedAt” ist gesetzt.

### Nachbedingungen im Fehlerfall

* Auth‑Fehler (`UNAUTHORIZED`).
* Ungültiger Zeitraum (`INVALID_INPUT`) oder Zeitraum zu groß (`RANGE_TOO_LARGE`).
* Report nicht gefunden (`NOT_FOUND`) oder gehört anderem Seller (`FORBIDDEN`).
* Systemfehler (`INTERNAL_ERROR`) → Status `FAILED`.

