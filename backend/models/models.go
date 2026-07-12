package models

import "time"

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleTeacher UserRole = "teacher"
)

type CurrentUser struct {
	Role  UserRole `json:"role"`
	ID    string   `json:"id"`
	Name  string   `json:"name"`
	Email string   `json:"email"`
	Token string   `json:"token,omitempty"`
}

type Student struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	RollNumber string `json:"rollNumber"`
	Email      string `json:"email"`
	ClassID    string `json:"classId"`
	Gender     string `json:"gender"`
}

type Class struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Grade     string `json:"grade"`
	Room      string `json:"room"`
	TeacherID string `json:"teacherId"`
}

type Teacher struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
}

type StudentStatus struct {
	StudentID string `json:"studentId"`
	Status    string `json:"status"`
}

type AttendanceRecord struct {
	ID          string          `json:"id"`
	ClassID     string          `json:"classId"`
	Date        string          `json:"date"` // Format: YYYY-MM-DD
	SubmittedBy string          `json:"submittedBy"`
	SubmittedAt time.Time       `json:"submittedAt"`
	Students    []StudentStatus `json:"students"`
}

type LoginRequest struct {
	Role     UserRole `json:"role"`
	Email    string   `json:"email"`
	Password string   `json:"password"`
}

type ErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ProblemDetails struct {
	Type     string        `json:"type"`
	Title    string        `json:"title"`
	Status   int           `json:"status"`
	Detail   string        `json:"detail"`
	Instance string        `json:"instance"`
	Errors   []ErrorDetail `json:"errors,omitempty"`
}
