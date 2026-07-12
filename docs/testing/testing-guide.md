# ScholaSync - Software Testing Guide

This guide details the testing standards and procedures designed to ensure quality, type safety, and correctness across both the **Go REST API** and **React Frontend** applications.

---

## 1. Go Backend Testing Standards

The backend architecture separates logic into isolated, single-responsibility units (Handlers, Services, Repositories). Testing reflects this separation.

### A. Unit Testing Service Layers (with Mocks)
The `service` package is tested by mocking out the `repository` interfaces. This lets us assert validations, role claims, and error handling without depending on a running database.

Example Go service unit test structure:

```go
package service_test

import (
	"testing"
	"scholasync/backend/models"
	"scholasync/backend/service"
)

type MockStudentRepository struct {
	// ... implements repository.StudentRepository
}

func TestStudentService_Create_Validation(t *testing.T) {
	mockRepo := &MockStudentRepository{}
	mockAttRepo := &MockAttendanceRepository{}
	studentService := service.NewStudentService(mockRepo, mockAttRepo)

	invalidStudent := &models.Student{
		Name:  "", // should trigger validation failure
		Email: "bad_email",
	}

	problem, err := studentService.Create(invalidStudent)
	if err != nil {
		t.Fatalf("Expected no execution error, got: %v", err)
	}

	if problem == nil {
		t.Fatal("Expected ProblemDetails to be returned for validation failure")
	}

	if problem.Status != 422 {
		t.Errorf("Expected status code 422, got %d", problem.Status)
	}
}
```

### B. Integration Testing HTTP Handlers (using `httptest`)
To test routing, controllers, and authentication middleware, we leverage standard library `net/http/httptest` recorders:

```go
package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"scholasync/backend/handler"
	"scholasync/backend/models"
)

func TestController_HandleLogin(t *testing.T) {
	ctrl := setupTestController() // helper to instantiate test controller

	body, _ := json.Marshal(models.LoginRequest{
		Role:     models.RoleAdmin,
		Email:    "admin@school.edu",
		Password: "admin123",
	})

	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	ctrl.HandleLogin(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	var user models.CurrentUser
	_ = json.NewDecoder(resp.Body).Decode(&user)
	if user.ID != "admin_1" {
		t.Errorf("Expected user ID admin_1, got %s", user.ID)
	}
}
```

### Running Backend Tests
Execute standard Go commands inside `/backend`:

```bash
cd backend
go test -v ./...
go test -cover ./...
```

---

## 2. React Frontend Testing Standards

### A. Testing Services (Clean Architecture)
Because the frontend has a distinct Presentation → Service → Repository layout, we can test state management and UI events in isolation.

- **Mocking Repositories:** Just as we did in the container, we can supply mock implementations of `IStudentRepository`, `IClassRepository`, etc., to verify that the frontend `StudentService` correctly filters and organizes components based on state.
- **Components Testing:** Utilize React Testing Library to test component renders, form submissions, and user animations:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AddStudentModal } from '../components/AddStudentModal';

test('renders and processes student enrollment validations', () => {
  render(<AddStudentModal isOpen={true} onClose={() => {}} />);
  
  const submitButton = screen.getByText('Enroll Student');
  fireEvent.click(submitButton);

  // Assert validation error highlights appear on screen
  expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
});
```

### Running Frontend Tests
Execute npm scripts inside `/frontend`:

```bash
cd frontend
npm run test      # if unit test suites are configured
npm run lint      # check full type integrity and static syntax rules
```

---

## 3. End-to-End System Testing (Integration)

When the entire stack is booted via `docker-compose up`, verify the integrated pipeline with the following `curl` suite:

```bash
# 1. Login as Administrator
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin", "email":"admin@school.edu", "password":"admin123"}' \
  -c cookies.txt

# 2. Get Student Directory (Authenticated)
curl -X GET http://localhost:8080/api/v1/students \
  -b cookies.txt

# 3. Trigger 403 Forbidden on Teacher delete constraint
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"teacher", "email":"sarah.j@school.edu", "password":"teacher123"}' \
  -c cookies_teacher.txt

# Try deleting a class (restricted to Admin role)
curl -X DELETE http://localhost:8080/api/v1/classes/c1 \
  -b cookies_teacher.txt
# Expected response: 403 Forbidden
```
