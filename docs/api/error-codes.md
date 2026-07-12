# ScholaSync - Standard API Error Blueprints

To maintain a robust integration between the Go REST API and the React client, all error responses must follow a structured **RFC 7807 (Problem Details for HTTP APIs)** schema. This ensures validation, authorization, and system errors are predictable, parseable, and actionable by the client.

---

## 1. Uniform Error Payload Schema

Every error returned by the server must adhere to the following JSON structure:

```json
{
  "type": "https://scholasync.edu/errors/validation-failure",
  "title": "Invalid Request Parameters",
  "status": 400,
  "detail": "One or more request parameters failed validation constraint checks.",
  "instance": "/api/v1/students",
  "errors": [
    {
      "field": "rollNumber",
      "message": "Roll number '10A01' is already assigned to another student."
    }
  ]
}
```

### Attributes:
- **`type`:** A URI reference identifying the specific error category documentation.
- **`title`:** A short, human-readable summary of the error type.
- **`status`:** The HTTP status code of the response.
- **`detail`:** A human-readable explanation of this specific occurrence.
- **`instance`:** The relative URI route where the error occurred.
- **`errors` (Optional):** An array of field-specific errors, particularly used for request payload validations.

---

## 2. API Error Registry

The Go API must map errors according to standard HTTP semantics:

| HTTP Status | Error Type Key | Purpose | Example Scenario |
|---|---|---|---|
| **`400`** | `bad-request` | Format or structure of payload is corrupt. | Malformed JSON sent in a POST body. |
| **`401`** | `unauthorized` | The client lacks valid authentication credentials. | Accessing `/api/v1/students` without a valid cookie or token. |
| **`403`** | `forbidden` | Authenticated user lacks permission for the action. | A `teacher` trying to call `DELETE /api/v1/students/{id}`. |
| **`404`** | `not-found` | The requested identifier does not match any database row. | Calling `GET /api/v1/students/std_non_existent`. |
| **`409`** | `conflict` | Resource write conflicts with system uniqueness rules. | Creating a new student using an existing `rollNumber`. |
| **`422`** | `validation-failure` | Parameter type checks or format assertions failed. | Submitting an email address missing the `@` symbol. |
| **`500`** | `internal-error` | Unexpected server fault or database outage. | Database connection pool exhausts. |

---

## 3. Reference Payload Examples

### A. Validation Failure (`422 Unprocessable Entity`)
```json
{
  "type": "https://scholasync.edu/errors/validation-failure",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Validation checks failed for enrollment.",
  "instance": "/api/v1/students",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email format ending in @school.edu"
    },
    {
      "field": "gender",
      "message": "Value must be one of: Male, Female, Other"
    }
  ]
}
```

### B. Access Forbidden (`403 Forbidden`)
```json
{
  "type": "https://scholasync.edu/errors/forbidden",
  "title": "Forbidden Access",
  "status": 403,
  "detail": "Your user profile does not hold permissions required to delete classroom resources. This action requires administrative rights.",
  "instance": "/api/v1/classes/cls_1"
}
```

### C. Resource Not Found (`404 Not Found`)
```json
{
  "type": "https://scholasync.edu/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "No active class registered with the identifier 'cls_999'.",
  "instance": "/api/v1/classes/cls_999"
}
```

### D. Duplicate Database Key Conflict (`409 Conflict`)
```json
{
  "type": "https://scholasync.edu/errors/conflict",
  "title": "Conflict Detected",
  "status": 409,
  "detail": "Failed to enroll student. Roll number '10A01' is already assigned to student 'Ethan Harrison'.",
  "instance": "/api/v1/students"
}
```
