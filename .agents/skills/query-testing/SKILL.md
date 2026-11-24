---
name: query-testing
status: beta
scope: workspace
description: >-
  Provides procedures, templates, and trigger points for testing GraphQL and REST API queries
  in VS Code (REST Client / Thunder Client) or Postman for this real estate map project.
  Activate whenever creating, modifying, debugging, or verifying API queries, endpoints, or data fetching.
---

# Query Testing Skill (VS Code & Postman)

This skill guides the agent and user in testing API queries (GraphQL and REST) before and during integration into the real estate map application.

## Proactive Notification Triggers

Always explicitly notify the user to run tests in **VS Code** or **Postman** under the following conditions:

1. **New or Modified Queries**: Whenever a new GraphQL query/mutation or REST endpoint is drafted or updated.
2. **Pre-Integration Checkpoint**: Before connecting mock or data-fetching hooks (e.g., in `components/map/use-properties.tsx`) to actual API endpoints.
3. **Schema or Data Structure Uncertainty**: When field types, nullability, pagination, or unique/distinct filters are uncertain.
4. **Authentication / Environment Setup**: When new headers, API keys, or bearer tokens are introduced.
5. **Data Fetching Errors**: When debugging API errors, CORS issues, or malformed responses.

---

## When Prompting the User

When alerting the user, always provide:
1. **The Exact Query / Request**: Pre-formatted for copy-pasting (GraphQL query with variables, or cURL / REST format).
2. **Target Endpoint & Headers**: Clear instructions on endpoint URL and required headers (e.g., `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`).
3. **What to Verify**: Specific fields to check in the response (e.g., coordinates `[latitude, longitude]`, unique IDs, price formatting).

---

## Testing Environments

### 1. VS Code Options
* **REST Client Extension (`.http` files)**:
  Provide a test file or block that can be run directly inside VS Code:
  ```http
  POST https://your-api-endpoint.com/graphql
  Content-Type: application/json
  Authorization: Bearer {{AUTH_TOKEN}}

  {
    "query": "query GetProperties { properties { id latitude longitude price } }"
  }
  ```
* **Thunder Client / RapidAPI Client**:
  Specify URL, Method (`POST`), Headers, and GraphQL Body or JSON Body.

### 2. Postman Options
* **GraphQL Request**:
  - Set request method to `POST`.
  - Under **Body**, select **GraphQL**.
  - Provide query and any query variables in the variables pane.
* **REST Request**:
  - Set method (`GET`/`POST`), URL, and Query Params.

---

## Response Verification Checklist

Before wiring the response into the UI:
- [ ] Coordinates exist and are valid numbers (`latitude` between -90 and 90, `longitude` between -180 and 180).
- [ ] Property IDs are unique and present for React key attributes and map marker tracking.
- [ ] Edge cases handled: Empty lists (`[]`), null fields (e.g., missing price or images).
