package service

import (
	"errors"
	"fmt"
	"regexp"
	"scholasync/backend/models"
	"scholasync/backend/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type StudentService struct {
	Repo           repository.StudentRepository
	AttendanceRepo repository.AttendanceRepository
}

func NewStudentService(repo repository.StudentRepository, attRepo repository.AttendanceRepository) *StudentService {
	return &StudentService{Repo: repo, AttendanceRepo: attRepo}
}

func (s *StudentService) GetAll(search, classID string) ([]models.Student, error) {
	return s.Repo.GetAll(search, classID)
}

func (s *StudentService) GetByID(id string) (*models.Student, error) {
	return s.Repo.GetByID(id)
}

func (s *StudentService) Create(student *models.Student) (*models.ProblemDetails, error) {
	if errs := s.validateStudent(student); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	// Check if roll number is unique
	all, err := s.Repo.GetAll("", "")
	if err != nil {
		return nil, err
	}
	for _, st := range all {
		if st.RollNumber == student.RollNumber {
			return &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/conflict",
				Title:  "Conflict Detected",
				Status: 409,
				Detail: fmt.Sprintf("Failed to enroll student. Roll number '%s' is already assigned to student '%s'.", student.RollNumber, st.Name),
			}, nil
		}
	}

	err = s.Repo.Create(student)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *StudentService) Update(student *models.Student) (*models.ProblemDetails, error) {
	if errs := s.validateStudent(student); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	// Check roll number uniqueness excluding self
	all, err := s.Repo.GetAll("", "")
	if err != nil {
		return nil, err
	}
	for _, st := range all {
		if st.RollNumber == student.RollNumber && st.ID != student.ID {
			return &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/conflict",
				Title:  "Conflict Detected",
				Status: 409,
				Detail: fmt.Sprintf("Failed to update student. Roll number '%s' is already assigned to student '%s'.", student.RollNumber, st.Name),
			}, nil
		}
	}

	err = s.Repo.Update(student)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *StudentService) Delete(id string) error {
	// Transactionally clean up join records
	err := s.AttendanceRepo.RemoveStudentFromRecords(id)
	if err != nil {
		return err
	}
	return s.Repo.Delete(id)
}

func (s *StudentService) validateStudent(student *models.Student) []models.ErrorDetail {
	var errs []models.ErrorDetail
	if len(student.Name) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "name", Message: "Name cannot be empty"})
	}
	if len(student.RollNumber) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "rollNumber", Message: "Roll number cannot be empty"})
	}

	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	if !emailRegex.MatchString(student.Email) {
		errs = append(errs, models.ErrorDetail{Field: "email", Message: "Must be a valid email format ending in @school.edu"})
	}

	if student.Gender != "Male" && student.Gender != "Female" && student.Gender != "Other" {
		errs = append(errs, models.ErrorDetail{Field: "gender", Message: "Value must be one of: Male, Female, Other"})
	}
	return errs
}

type ClassService struct {
	Repo           repository.ClassRepository
	StudentRepo    repository.StudentRepository
	AttendanceRepo repository.AttendanceRepository
}

func NewClassService(repo repository.ClassRepository, studentRepo repository.StudentRepository, attRepo repository.AttendanceRepository) *ClassService {
	return &ClassService{Repo: repo, StudentRepo: studentRepo, AttendanceRepo: attRepo}
}

func (cs *ClassService) GetAll() ([]models.Class, error) {
	return cs.Repo.GetAll()
}

func (cs *ClassService) GetByID(id string) (*models.Class, error) {
	return cs.Repo.GetByID(id)
}

func (cs *ClassService) Create(c *models.Class) (*models.ProblemDetails, error) {
	if errs := cs.validateClass(c); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	err := cs.Repo.Create(c)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (cs *ClassService) Update(c *models.Class) (*models.ProblemDetails, error) {
	if errs := cs.validateClass(c); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	err := cs.Repo.Update(c)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (cs *ClassService) Delete(id string) error {
	// Clean up related students class assignments (Set null)
	students, err := cs.StudentRepo.GetAll("", id)
	if err == nil {
		for _, s := range students {
			s.ClassID = ""
			_ = cs.StudentRepo.Update(&s)
		}
	}
	// Clean up attendance sheets of this class
	_ = cs.AttendanceRepo.DeleteByClassID(id)

	return cs.Repo.Delete(id)
}

func (cs *ClassService) validateClass(c *models.Class) []models.ErrorDetail {
	var errs []models.ErrorDetail
	if len(c.Name) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "name", Message: "Class name cannot be empty"})
	}
	if len(c.Grade) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "grade", Message: "Grade cannot be empty"})
	}
	if len(c.Room) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "room", Message: "Room cannot be empty"})
	}
	return errs
}

type TeacherService struct {
	Repo repository.TeacherRepository
}

func NewTeacherService(repo repository.TeacherRepository) *TeacherService {
	return &TeacherService{Repo: repo}
}

func (ts *TeacherService) GetAll() ([]models.Teacher, error) {
	return ts.Repo.GetAll()
}

func (ts *TeacherService) GetByID(id string) (*models.Teacher, error) {
	return ts.Repo.GetByID(id)
}

type AttendanceService struct {
	Repo repository.AttendanceRepository
}

func NewAttendanceService(repo repository.AttendanceRepository) *AttendanceService {
	return &AttendanceService{Repo: repo}
}

func (as *AttendanceService) GetAll(classID, date string) ([]models.AttendanceRecord, error) {
	return as.Repo.GetAll(classID, date)
}

func (as *AttendanceService) GetByClassAndDate(classID, date string) (*models.AttendanceRecord, error) {
	return as.Repo.GetByClassAndDate(classID, date)
}

func (as *AttendanceService) Save(record *models.AttendanceRecord) (*models.ProblemDetails, error) {
	if record.ClassID == "" {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "classId is required to submit attendance records.",
		}, nil
	}
	if record.Date == "" {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "date is required to submit attendance records.",
		}, nil
	}

	err := as.Repo.Save(record)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

type AuthService struct {
	TeacherRepo repository.TeacherRepository
	SecretKey   []byte
}

func NewAuthService(repo repository.TeacherRepository, secret string) *AuthService {
	return &AuthService{TeacherRepo: repo, SecretKey: []byte(secret)}
}

func (as *AuthService) Login(req models.LoginRequest) (*models.CurrentUser, *models.ProblemDetails, error) {
	// Standard validation for all roles
	if req.Email == "" || req.Password == "" {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Missing Credentials",
			Status: 400,
			Detail: "Both Email and Password parameters are mandatory to initiate authentications.",
		}, nil
	}

	var userID, userName string

	if req.Role == models.RoleAdmin {
		if req.Email != "admin@school.edu" || req.Password != "admin123" {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The username or password provided is incorrect.",
			}, nil
		}
		userID = "admin_1"
		userName = "Principal Arthur"
	} else if req.Role == models.RoleTeacher {
		// Verify email exists in db
		teacher, err := as.TeacherRepo.GetByEmail(req.Email)
		if err != nil {
			return nil, nil, err
		}
		// Assuming password is "teacher123" for seed profiles for testing
		if teacher == nil || req.Password != "teacher123" {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The email or password provided is incorrect.",
			}, nil
		}
		userID = teacher.ID
		userName = teacher.Name
	} else {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Role Configuration",
			Status: 400,
			Detail: "The authentication handshake role must be either 'admin' or 'teacher'.",
		}, nil
	}

	// Generate standard secure JWT claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   userID,
		"name":  userName,
		"email": req.Email,
		"role":  string(req.Role),
		"iss":   "scholasync-auth-service",
		"aud":   "scholasync-client-app",
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(as.SecretKey)
	if err != nil {
		return nil, nil, err
	}

	return &models.CurrentUser{
		Role:  req.Role,
		ID:    userID,
		Name:  userName,
		Email: req.Email,
		Token: tokenString,
	}, nil, nil
}

func (as *AuthService) ValidateToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return as.SecretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, errors.New("invalid jwt token")
}
