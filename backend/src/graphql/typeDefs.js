export default /* GraphQL */ `
  scalar DateTime

  enum B2BErrorCode {
    UNAUTHORIZED
    FORBIDDEN
    NOT_FOUND
    INVALID_INPUT
    RANGE_TOO_LARGE
    BATCH_TOO_LARGE
    IDEMPOTENCY_CONFLICT
    INTERNAL_ERROR
  }

  type B2BError {
    code: B2BErrorCode!
    message: String!
  }

  type BusinessIdentity {
    userId: ID!
    name: String!
    companyName: String!
  }

  type Category {
    id: ID!
    name: String!
    description: String
  }

  type Offer {
    id: ID!
    seller: String
    price: Float
  }

  type Product {
    id: ID!
    name: String
    description: String
    categories: [Category!]!
    offers: [Offer!]!
  }

  # -----------------------------
  # B2B-3 Offer Sync Batch
  # -----------------------------
  enum OfferSyncAction {
    UPSERT
    REMOVE
  }

  enum OfferSyncBatchStatus {
    ACCEPTED
    PROCESSING
    DONE
    FAILED
  }

  enum ItemResultStatus {
    OK
    ERROR
  }

  type OfferSyncBatchSummary {
    processedCount: Int!
    successCount: Int!
    errorCount: Int!
  }

  type OfferSyncItem {
    lineNo: Int!
    productId: ID!
    action: OfferSyncAction!
    offerId: ID
    seller: String
    price: Float

    result: ItemResultStatus!
    errorCode: B2BErrorCode
    message: String
  }

  type OfferSyncBatch {
    id: ID!
    status: OfferSyncBatchStatus!
    createdAt: DateTime!
    startedAt: DateTime
    finishedAt: DateTime
    idempotencyKey: String
    sellerUserId: ID!
    summary: OfferSyncBatchSummary!
    items: [OfferSyncItem!]!
  }

  input OfferSyncItemInput {
    lineNo: Int
    productId: ID!
    action: OfferSyncAction!
    offerId: ID
    seller: String
    price: Float
  }

  input SubmitOfferSyncBatchInput {
    idempotencyKey: String
    items: [OfferSyncItemInput!]!
  }

  type SubmitOfferSyncBatchPayload {
    ok: Boolean!
    error: B2BError
    batchId: ID
    status: OfferSyncBatchStatus
  }

  type OfferSyncBatchStatusPayload {
    ok: Boolean!
    error: B2BError
    batchId: ID!
    status: OfferSyncBatchStatus
    startedAt: DateTime
    finishedAt: DateTime
  }

  type OfferSyncBatchResultPayload {
    ok: Boolean!
    error: B2BError
    batch: OfferSyncBatch
  }

  # -----------------------------
  # B2B-4 Sales Report Export
  # -----------------------------
  enum SalesReportStatus {
    QUEUED
    RUNNING
    READY
    FAILED
  }

  enum SalesReportFormat {
    JSON
    CSV
  }

  type SalesReportTotals {
    orderCount: Int!
    revenue: Float!
  }

  type SalesReport {
    id: ID!
    status: SalesReportStatus!
    from: DateTime!
    to: DateTime!
    format: SalesReportFormat!
    createdAt: DateTime!
    startedAt: DateTime
    finishedAt: DateTime
    receivedAt: DateTime
    totals: SalesReportTotals
    message: String
  }

  type SalesReportLine {
    lineNo: Int!
    orderId: ID!
    createdAt: DateTime!
    offerId: ID!
    productId: ID
    productName: String
    seller: String
    price: Float
  }

  type PageInfo {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
  }

  type SalesReportPage {
    report: SalesReport!
    pageInfo: PageInfo!
    lines: [SalesReportLine!]!
  }

  input RequestSalesReportInput {
    from: DateTime!
    to: DateTime!
    format: SalesReportFormat = JSON
    idempotencyKey: String
  }

  type RequestSalesReportPayload {
    ok: Boolean!
    error: B2BError
    reportId: ID
    status: SalesReportStatus
  }

  type SalesReportStatusPayload {
    ok: Boolean!
    error: B2BError
    reportId: ID!
    status: SalesReportStatus
    message: String
  }

  type SalesReportPagePayload {
    ok: Boolean!
    error: B2BError
    page: SalesReportPage
  }

  type ConfirmPayload {
    ok: Boolean!
    error: B2BError
  }


  type Query {
    products(limit: Int = 50): [Product!]!
    offers(productId: ID!): [Offer!]!

    # B2B auth proof
    b2bMe: BusinessIdentity

    # B2B-3
    offerSyncBatchStatus(batchId: ID!): OfferSyncBatchStatusPayload!
    offerSyncBatchResult(batchId: ID!): OfferSyncBatchResultPayload!
    offerSyncBatches(limit: Int = 20): [OfferSyncBatch!]!

    # B2B-4
    salesReportStatus(reportId: ID!): SalesReportStatusPayload!
    salesReport(reportId: ID!, page: Int = 1, pageSize: Int = 50): SalesReportPagePayload!
    salesReports(limit: Int = 20): [SalesReport!]!
  }

  type Mutation {
    # B2B-3
    submitOfferSyncBatch(input: SubmitOfferSyncBatchInput!): SubmitOfferSyncBatchPayload!

    # B2B-4
    requestSalesReport(input: RequestSalesReportInput!): RequestSalesReportPayload!
    confirmSalesReportReceived(reportId: ID!): ConfirmPayload!
  }
`;
