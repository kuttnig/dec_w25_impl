## GraphQL ist erreichbar

`POST {{baseUrl}}`

Headers: (keine Pflicht)

```graphql
query {
  products(limit: 3) {
    id
    name
  }
}
```

**Ergebnis:**

```json
{
    "data": {
        "products": [
            {
                "id": "507f1f77bcf86cd799439017",
                "name": "Garden Tool Set"
            },
            {
                "id": "507f1f77bcf86cd799439018",
                "name": "Mountain Bike"
            },
            {
                "id": "507f1f77bcf86cd799439019",
                "name": "Mystery Novel Collection"
            }
        ]
    }
}
```

## b2bMe (ohne Key)

`POST {{baseUrl}}`

Headers: kein `x-b2b-key`

```graphql
query {
  b2bMe {
    userId
    name
    companyName
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "b2bMe": null
    }
}
```

## b2bMe (mit Key)

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  b2bMe {
    userId
    name
    companyName
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "b2bMe": {
            "userId": "507f1f77bcf86cd799439020",
            "name": "Raphael",
            "companyName": "Raphael AG"
        }
    }
}
```

**Erwartet:**

data.b2bMe.userId ist gesetzt

companyName passt zum Seller

## B2B - 3: List Products, choose product ids

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  products(limit: 2) {
    id
    name
    offers { id seller price }
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "products": [
            {
                "id": "507f1f77bcf86cd799439017",
                "name": "Garden Tool Set",
                "offers": [
                    {
                        "id": "507f191e810c19729de860ef",
                        "seller": "Garden Masters",
                        "price": 45.99
                    },
                    {
                        "id": "507f191e810c19729de860f0",
                        "seller": "Home Essentials",
                        "price": 39.5
                    },
                    {
                        "id": "507f191e810c19729de860f1",
                        "seller": "Outdoor Living Co",
                        "price": 52
                    },
                    {
                        "id": "507f191e810c19729de860f2",
                        "seller": "BuildIt Store",
                        "price": 42.75
                    },
                    {
                        "id": "507f191e810c19729de860f3",
                        "seller": "Green Space",
                        "price": 48.25
                    }
                ]
            },
            {
                "id": "507f1f77bcf86cd799439018",
                "name": "Mountain Bike",
                "offers": [
                    {
                        "id": "507f191e810c19729de860f4",
                        "seller": "SportGear Inc",
                        "price": 129.99
                    },
                    {
                        "id": "507f191e810c19729de860f5",
                        "seller": "Athletic World",
                        "price": 119.5
                    },
                    {
                        "id": "507f191e810c19729de860f6",
                        "seller": "Outdoor Experts",
                        "price": 145
                    },
                    {
                        "id": "507f191e810c19729de860f7",
                        "seller": "Adventure Supplies",
                        "price": 135.75
                    },
                    {
                        "id": "507f191e810c19729de860f8",
                        "seller": "Performance Sports",
                        "price": 140
                    }
                ]
            }
        ]
    }
}
```

**Erwartet:**

Liste mit Produkte -> productId wählen

## B2B - 3: Submit Offer Sync Batch (partial success)

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
mutation Submit($input: SubmitOfferSyncBatchInput!) {
  submitOfferSyncBatch(input: $input) {
    ok
    error { code message }
    batchId
    status
  }
}
```

```graphql
{
  "input": {
    "idempotencyKey": "demo-batch-001",
    "items": [
      { "lineNo": 1, "productId": "{{productId}}", "action": "UPSERT", "seller": "Seller 1 GmbH", "price": 9.99 },
      { "lineNo": 2, "productId": "{{productId}}", "action": "UPSERT", "seller": "Seller 1 GmbH", "price": -1 },
      { "lineNo": 3, "productId": "000000000000000000000000", "action": "UPSERT", "seller": "Seller 1 GmbH", "price": 5.0 }
    ]
  }
}

```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "submitOfferSyncBatch": {
            "ok": true,
            "error": null,
            "batchId": "696765e1aed95056c3e1b5ec",
            "status": "DONE"
        }
    }
}
```

**Erwartet:**

- `ok: true`
- `batchId` ist gesetzt
- Zusätzlich idempotency check: ein weiterer Request muss die selbe batchId liefern. (bei gleichem idempotencyKey)

## B2B - 3: Poll Batch Status

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  offerSyncBatchStatus(batchId: "{{batchId}}") {
    ok
    error { code message }
    batchId
    status
    startedAt
    finishedAt
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "offerSyncBatchStatus": {
            "ok": true,
            "error": null,
            "batchId": "696765e1aed95056c3e1b5ec",
            "status": "DONE",
            "startedAt": "2026-01-14T09:46:09.919Z",
            "finishedAt": "2026-01-14T09:46:09.961Z"
        }
    }
}
```

**Erwartet:**
- Anfangs: status = ACCEPTED oder PROCESSING
- Nach erneutem Senden: status = DONE (oder FAILED bei Fehler)

## B2B - 3: Get Batch Result

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  offerSyncBatchResult(batchId: "{{batchId}}") {
    ok
    error { code message }
    batch {
      id
      status
      createdAt
      summary { processedCount successCount errorCount }
      items {
        lineNo
        productId
        action
        offerId
        seller
        price
        result
        errorCode
        message
      }
    }
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "offerSyncBatchResult": {
            "ok": true,
            "error": null,
            "batch": {
                "id": "696765e1aed95056c3e1b5ec",
                "status": "DONE",
                "createdAt": "2026-01-14T09:46:09.731Z",
                "summary": {
                    "processedCount": 3,
                    "successCount": 1,
                    "errorCount": 2
                },
                "items": [
                    {
                        "lineNo": 1,
                        "productId": "507f1f77bcf86cd799439018",
                        "action": "UPSERT",
                        "offerId": "696765e1aed95056c3e1b5f1",
                        "seller": "Seller 1 GmbH",
                        "price": 9.99,
                        "result": "OK",
                        "errorCode": null,
                        "message": "offer created"
                    },
                    {
                        "lineNo": 2,
                        "productId": "507f1f77bcf86cd799439017",
                        "action": "UPSERT",
                        "offerId": null,
                        "seller": "Seller 1 GmbH",
                        "price": -1,
                        "result": "ERROR",
                        "errorCode": "INVALID_INPUT",
                        "message": "price must be > 0 for UPSERT"
                    },
                    {
                        "lineNo": 3,
                        "productId": "000000000000000000000000",
                        "action": "UPSERT",
                        "offerId": null,
                        "seller": "Seller 1 GmbH",
                        "price": 5,
                        "result": "ERROR",
                        "errorCode": "NOT_FOUND",
                        "message": "product not found"
                    }
                ]
            }
        }
    }
}
```

**Erwartet:**
- batch.summary.processedCount = 3
- successCount = 1
- errorCount = 2
- Item 1: result = OK, offerId gesetzt
- Item 2: result = ERROR, errorCode = INVALID_INPUT (price <= 0)
- Item 3: result = ERROR, errorCode = NOT_FOUND (product not found)

## B2B - 3: Verify Offers on Product

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  offers(productId: "507f1f77bcf86cd799439017") {
    id
    seller
    price
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "offers": [
            {
                "id": "507f191e810c19729de860ef",
                "seller": "Garden Masters",
                "price": 45.99
            },
            {
                "id": "507f191e810c19729de860f0",
                "seller": "Home Essentials",
                "price": 39.5
            },
            {
                "id": "507f191e810c19729de860f1",
                "seller": "Outdoor Living Co",
                "price": 52
            },
            {
                "id": "507f191e810c19729de860f2",
                "seller": "BuildIt Store",
                "price": 42.75
            },
            {
                "id": "507f191e810c19729de860f3",
                "seller": "Green Space",
                "price": 48.25
            },
            {
                "id": "6968e41b84ca70fea93bb5c7",
                "seller": "Seller 1 GmbH",
                "price": 9.99
            }
        ]
    }
}
```

**Erwartet:**
- Ein Offer mit seller = "Seller 1 GmbH" und price = 9.99 ist enthalten.

## B2B - 4: Request Sales Report

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
mutation Request($input: RequestSalesReportInput!) {
  requestSalesReport(input: $input) {
    ok
    error { code message }
    reportId
    status
  }
}
```

```json
{
  "input": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.000Z",
    "format": "JSON",
    "idempotencyKey": "demo-report-001"
  }
}

```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "requestSalesReport": {
            "ok": true,
            "error": null,
            "reportId": "69678489aed95056c3e1b665",
            "status": "READY"
        }
    }
}
```

**Erwartet:**
- ok: true
- reportId gesetzt, speichern für nächsten request
- status: QUEUED (oder direkt RUNNING oder READY wenn schon fertig)
- Idempotency check: gleicher idempotencyKey -> gleiche reportId

## B2B - 4: Poll Report Status

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  salesReportStatus(reportId: "{{reportId}}") {
    ok
    error { code message }
    reportId
    status
    message
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "salesReportStatus": {
            "ok": true,
            "error": null,
            "reportId": "69678489aed95056c3e1b665",
            "status": "READY",
            "message": null
        }
    }
}
```

**Erwartet:**
- QUEUED -> RUNNING -> READY (oder FAILED bei Systemfehler)

## B2B - 4: Fetch Report Page 1

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
query {
  salesReport(reportId: "{{reportId}}", page: 1, pageSize: 2) {
    ok
    error { code message }
    page {
      report {
        id
        status
        from
        to
        createdAt
        finishedAt
        totals { orderCount revenue }
        receivedAt
      }
      pageInfo { page pageSize totalItems totalPages }
      lines {
        lineNo
        orderId
        createdAt
        offerId
        productId
        productName
        seller
        price
      }
    }
  }
}

```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "salesReport": {
            "ok": true,
            "error": null,
            "page": {
                "report": {
                    "id": "69678489aed95056c3e1b665",
                    "status": "READY",
                    "from": "2025-01-01T00:00:00.000Z",
                    "to": "2025-01-31T23:59:59.000Z",
                    "createdAt": "2026-01-14T11:56:57.086Z",
                    "finishedAt": "2026-01-14T11:56:57.314Z",
                    "totals": {
                        "orderCount": 0,
                        "revenue": 0
                    },
                    "receivedAt": "2026-01-14T12:03:34.930Z"
                },
                "pageInfo": {
                    "page": 1,
                    "pageSize": 2,
                    "totalItems": 0,
                    "totalPages": 1
                },
                "lines": []
            }
        }
    }
}
```

**Erwartet:**
- Wenn noch keine Orders:
    - totals.orderCount = 0, revenue = 0
    - lines ist leer, totalItems = 0
- Wenn Orders existieren:
    - lines enthält Einträge
    - pageInfo.totalPages >= 1

## B2B - 4: Confirm Received

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
mutation {
  confirmSalesReportReceived(reportId: "{{reportId}}") {
    ok
    error { code message }
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "confirmSalesReportReceived": {
            "ok": true,
            "error": null
        }
    }
}
```

**Erwartet:**

- ok: true
- report.receivedAt ist nun gesetzt

## B2B - 4: Invalid date range

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
mutation Request($input: RequestSalesReportInput!) {
  requestSalesReport(input: $input) {
    ok
    error { code message }
    reportId
    status
  }
}

```

```json
{
  "input": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "invalid",
    "format": "JSON",
    "idempotencyKey": "demo-report-001"
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "requestSalesReport": {
            "ok": false,
            "error": {
                "code": "INVALID_INPUT",
                "message": "from/to must be valid ISO dates"
            },
            "reportId": null,
            "status": null
        }
    }
}
```

**Erwartet:**
- ok: false
- error.code = INVALID_INPUT

## B2B - 4: Date Range too large

`POST {{baseUrl}}`

Headers:  `x-b2b-key: "b2b_raphael_456"`

```graphql
mutation Request($input: RequestSalesReportInput!) {
  requestSalesReport(input: $input) {
    ok
    error { code message }
    reportId
    status
  }
}

```

```json
{
  "input": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-12-31T23:59:59.000Z",
    "format": "JSON",
    "idempotencyKey": "demo-report-001"
  }
}
```

**Ergebnis:**

`200 OK`

```json
{
    "data": {
        "requestSalesReport": {
            "ok": false,
            "error": {
                "code": "RANGE_TOO_LARGE",
                "message": "max date range is 90 days"
            },
            "reportId": null,
            "status": null
        }
    }
}
```

**Erwartet:**
- ok: false
- error.code = RANGE_TOO_LARGE