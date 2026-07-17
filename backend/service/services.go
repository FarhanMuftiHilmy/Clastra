package service

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"scholasync/backend/models"
	"scholasync/backend/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
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

func (s *StudentService) AddStudentToClass(studentID, classID string) error {
	// Ensure student exists
	st, err := s.Repo.GetByID(studentID)
	if err != nil {
		return err
	}
	if st == nil {
		return fmt.Errorf("student not found")
	}
	// Ensure class exists - repository may be nil here but caller usually has class repo
	// Use attendance repo / other checks omitted for simplicity
	return s.Repo.AddClass(studentID, classID)
}

func (s *StudentService) RemoveStudentFromClass(studentID, classID string) error {
	// Ensure student exists
	st, err := s.Repo.GetByID(studentID)
	if err != nil {
		return err
	}
	if st == nil {
		return fmt.Errorf("student not found")
	}
	return s.Repo.RemoveClass(studentID, classID)
}

func (s *StudentService) GetStudentClassIDs(studentID string) ([]string, error) {
	return s.Repo.GetClassIDs(studentID)
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
	Repo         repository.TeacherRepository
	ResendAPIKey string
	FrontendURL  string
	ClassRepo    repository.ClassRepository
}

func NewTeacherService(repo repository.TeacherRepository, classRepo repository.ClassRepository, resendKey, frontendURL string) *TeacherService {
	return &TeacherService{Repo: repo, ClassRepo: classRepo, ResendAPIKey: resendKey, FrontendURL: frontendURL}
}

func (ts *TeacherService) GetAll() ([]models.Teacher, error) {
	return ts.Repo.GetAll()
}

func (ts *TeacherService) GetByID(id string) (*models.Teacher, error) {
	return ts.Repo.GetByID(id)
}

func (ts *TeacherService) Create(teacher *models.Teacher) (*models.ProblemDetails, error) {
	if errs := ts.validateTeacher(teacher); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	existing, err := ts.Repo.GetByEmail(teacher.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/conflict",
			Title:  "Conflict Detected",
			Status: 409,
			Detail: fmt.Sprintf("A teacher with email '%s' is already registered.", teacher.Email),
		}, nil
	}

	teacher.ID = fmt.Sprintf("t_%d", time.Now().UnixNano())
	teacher.PasswordHash = ""
	teacher.ActivationToken = ts.generateActivationToken()
	teacher.IsActive = false

	err = ts.Repo.Create(teacher)
	if err != nil {
		return nil, err
	}

	if err := ts.sendActivationEmail(teacher); err != nil {
		return nil, err
	}

	return nil, nil
}

func (ts *TeacherService) Activate(token, password string) (*models.Teacher, *models.ProblemDetails, error) {
	if token == "" {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Missing Activation Token",
			Status: 400,
			Detail: "Activation token is required.",
		}, nil
	}

	if len(password) < 8 {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Weak Password",
			Status: 422,
			Detail: "Password must be at least 8 characters long.",
		}, nil
	}

	teacher, err := ts.Repo.GetByActivationToken(token)
	if err != nil {
		return nil, nil, err
	}
	if teacher == nil {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/not-found",
			Title:  "Invalid Activation Token",
			Status: 400,
			Detail: "The provided activation token is invalid or expired.",
		}, nil
	}
	if teacher.IsActive {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/conflict",
			Title:  "Already Activated",
			Status: 409,
			Detail: "This account has already been activated.",
		}, nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	teacher.PasswordHash = string(hash)
	teacher.ActivationToken = ""
	teacher.IsActive = true

	if err := ts.Repo.Update(teacher); err != nil {
		return nil, nil, err
	}

	return teacher, nil, nil
}

func (ts *TeacherService) generateActivationToken() string {
	randomBytes := make([]byte, 24)
	_, _ = rand.Read(randomBytes)
	return hex.EncodeToString(randomBytes)
}

func (ts *TeacherService) sendActivationEmail(teacher *models.Teacher) error {
	if ts.ResendAPIKey == "" {
		fmt.Printf("[WARN] RESEND_API_KEY not configured. Skipping activation email for %s\n", teacher.Email)
		return nil
	}

	if ts.FrontendURL == "" {
		return fmt.Errorf("frontend URL is not configured for activation email")
	}

	activationURL := fmt.Sprintf("%s/?activationToken=%s", ts.FrontendURL, teacher.ActivationToken)

	type resendPayload struct {
		From    string   `json:"from"`
		To      []string `json:"to"`
		Subject string   `json:"subject"`
		Html    string   `json:"html"`
		Text    string   `json:"text"`
	}

	payload := resendPayload{
		From:    "Clastra <no-reply@rech-it.com>",
		To:      []string{teacher.Email},
		Subject: "Activate your Clastra teacher account",
		Html:    fmt.Sprintf(`<p>Hello %s,</p><p>Please click the link below to set your password and activate your account:</p><p><a href="%s">Activate your account</a></p><p>If you did not request this account, please ignore this email.</p>`, teacher.Name, activationURL),
		Text:    fmt.Sprintf("Hello %s,\n\nPlease open the following link to set your password and activate your account:\n%s\n\nIf you did not request this account, ignore this email.", teacher.Name, activationURL),
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.ResendAPIKey))

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		var serverErr struct {
			Error string `json:"error"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&serverErr)
		return fmt.Errorf("failed to send activation email: %s", serverErr.Error)
	}

	return nil
}

func (ts *TeacherService) validateTeacher(teacher *models.Teacher) []models.ErrorDetail {
	var errs []models.ErrorDetail
	if len(teacher.Name) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "name", Message: "Name cannot be empty"})
	}
	if len(teacher.Subject) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "subject", Message: "Subject cannot be empty"})
	}
	if len(teacher.Email) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "email", Message: "Email cannot be empty"})
	} else {
		emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
		if !emailRegex.MatchString(teacher.Email) {
			errs = append(errs, models.ErrorDetail{Field: "email", Message: "Must be a valid email format"})
		}
	}
	return errs
}

func (ts *TeacherService) Update(teacher *models.Teacher) (*models.ProblemDetails, error) {
	if errs := ts.validateTeacher(teacher); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	// Check email uniqueness excluding self
	all, err := ts.Repo.GetAll()
	if err != nil {
		return nil, err
	}
	for _, t := range all {
		if t.Email == teacher.Email && t.ID != teacher.ID {
			return &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/conflict",
				Title:  "Conflict Detected",
				Status: 409,
				Detail: fmt.Sprintf("Failed to update teacher. Email '%s' is already assigned to '%s'.", teacher.Email, t.Name),
			}, nil
		}
	}

	if err := ts.Repo.Update(teacher); err != nil {
		return nil, err
	}
	return nil, nil
}

func (ts *TeacherService) Delete(id string) error {
	// Unassign teacher from any classes
	classes, err := ts.ClassRepo.GetAll()
	if err == nil {
		for _, c := range classes {
			if c.TeacherID == id {
				c.TeacherID = ""
				_ = ts.ClassRepo.Update(&c)
			}
		}
	}

	return ts.Repo.Delete(id)
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

func (as *AttendanceService) DeleteByClassID(classID string) error {
	if classID == "" {
		return fmt.Errorf("classId is required to delete attendance records")
	}
	return as.Repo.DeleteByClassID(classID)
}

type AuthService struct {
	TeacherRepo repository.TeacherRepository
	AdminRepo   repository.AdminRepository
	SecretKey   []byte
}

func NewAuthService(teacherRepo repository.TeacherRepository, adminRepo repository.AdminRepository, secret string) *AuthService {
	return &AuthService{TeacherRepo: teacherRepo, AdminRepo: adminRepo, SecretKey: []byte(secret)}
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

	var userID, userName, userRole string

	if req.Role == models.RoleAdmin {
		admin, err := as.AdminRepo.GetByEmail(req.Email)
		if err != nil {
			return nil, nil, err
		}
		if admin == nil {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The username or password provided is incorrect.",
			}, nil
		}
		if !admin.IsActive {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/forbidden",
				Title:  "Account Not Activated",
				Status: 403,
				Detail: "This admin account has not been activated yet.",
			}, nil
		}
		if admin.PasswordHash == "" {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The username or password provided is incorrect.",
			}, nil
		}
		if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The username or password provided is incorrect.",
			}, nil
		}
		userID = admin.ID
		userName = admin.Name
		userRole = admin.Role
	} else if req.Role == models.RoleTeacher {
		teacher, err := as.TeacherRepo.GetByEmail(req.Email)
		if err != nil {
			return nil, nil, err
		}
		if teacher == nil {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The email or password provided is incorrect.",
			}, nil
		}
		if !teacher.IsActive {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/forbidden",
				Title:  "Account Not Activated",
				Status: 403,
				Detail: "This teacher account has not been activated yet.",
			}, nil
		}
		if teacher.PasswordHash == "" {
			return nil, &models.ProblemDetails{
				Type:   "https://scholasync.edu/errors/unauthorized",
				Title:  "Authentication Failure",
				Status: 401,
				Detail: "The email or password provided is incorrect.",
			}, nil
		}
		if err := bcrypt.CompareHashAndPassword([]byte(teacher.PasswordHash), []byte(req.Password)); err != nil {
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
		Role:      req.Role,
		ID:        userID,
		Name:      userName,
		Email:     req.Email,
		AdminRole: userRole,
		Token:     tokenString,
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

// Admin Service
type AdminService struct {
	Repo         repository.AdminRepository
	ResendAPIKey string
	FrontendURL  string
}

func NewAdminService(repo repository.AdminRepository, resendKey, frontendURL string) *AdminService {
	return &AdminService{Repo: repo, ResendAPIKey: resendKey, FrontendURL: frontendURL}
}

func (as *AdminService) GetAll() ([]models.Admin, error) {
	return as.Repo.GetAll()
}

func (as *AdminService) GetByID(id string) (*models.Admin, error) {
	return as.Repo.GetByID(id)
}

func (as *AdminService) Create(admin *models.Admin) (*models.ProblemDetails, error) {
	if errs := as.validateAdmin(admin); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	// Check if email is already registered
	existing, err := as.Repo.GetByEmail(admin.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/conflict",
			Title:  "Conflict Detected",
			Status: 409,
			Detail: fmt.Sprintf("An admin with email '%s' is already registered.", admin.Email),
		}, nil
	}

	admin.ID = fmt.Sprintf("adm_%d", time.Now().UnixNano())
	admin.PasswordHash = ""
	admin.ActivationToken = as.generateActivationToken()
	admin.IsActive = false
	admin.CreatedAt = time.Now()

	err = as.Repo.Create(admin)
	if err != nil {
		return nil, err
	}

	// Send activation email
	if err := as.sendActivationEmail(admin); err != nil {
		fmt.Printf("[WARN] Failed to send activation email: %v\n", err)
		// Don't fail the creation just because email failed
	}

	return nil, nil
}

func (as *AdminService) Update(admin *models.Admin) (*models.ProblemDetails, error) {
	if errs := as.validateAdmin(admin); len(errs) > 0 {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Invalid Request Parameters",
			Status: 422,
			Detail: "One or more request parameters failed validation constraint checks.",
			Errors: errs,
		}, nil
	}

	// Check email uniqueness excluding self
	existing, err := as.Repo.GetByEmail(admin.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil && existing.ID != admin.ID {
		return &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/conflict",
			Title:  "Conflict Detected",
			Status: 409,
			Detail: fmt.Sprintf("An admin with email '%s' is already registered.", admin.Email),
		}, nil
	}

	err = as.Repo.Update(admin)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (as *AdminService) Delete(id string) error {
	return as.Repo.Delete(id)
}

func (as *AdminService) Activate(token, password string) (*models.Admin, *models.ProblemDetails, error) {
	if token == "" {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Missing Activation Token",
			Status: 400,
			Detail: "Activation token is required.",
		}, nil
	}

	if len(password) < 8 {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/validation-failure",
			Title:  "Weak Password",
			Status: 422,
			Detail: "Password must be at least 8 characters long.",
		}, nil
	}

	admin, err := as.Repo.GetByActivationToken(token)
	if err != nil {
		return nil, nil, err
	}
	if admin == nil {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/not-found",
			Title:  "Invalid Activation Token",
			Status: 400,
			Detail: "The provided activation token is invalid or expired.",
		}, nil
	}
	if admin.IsActive {
		return nil, &models.ProblemDetails{
			Type:   "https://scholasync.edu/errors/conflict",
			Title:  "Already Activated",
			Status: 409,
			Detail: "This account has already been activated.",
		}, nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	admin.PasswordHash = string(hash)
	admin.ActivationToken = ""
	admin.IsActive = true

	if err := as.Repo.Update(admin); err != nil {
		return nil, nil, err
	}

	return admin, nil, nil
}

func (as *AdminService) validateAdmin(admin *models.Admin) []models.ErrorDetail {
	var errs []models.ErrorDetail
	if len(admin.Name) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "name", Message: "Name cannot be empty"})
	}
	if len(admin.Email) == 0 {
		errs = append(errs, models.ErrorDetail{Field: "email", Message: "Email cannot be empty"})
	}
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	if !emailRegex.MatchString(admin.Email) {
		errs = append(errs, models.ErrorDetail{Field: "email", Message: "Must be a valid email address"})
	}
	if admin.Role != "super" && admin.Role != "limited" {
		errs = append(errs, models.ErrorDetail{Field: "role", Message: "Role must be 'super' or 'limited'"})
	}
	return errs
}

func (as *AdminService) generateActivationToken() string {
	randomBytes := make([]byte, 24)
	_, _ = rand.Read(randomBytes)
	return hex.EncodeToString(randomBytes)
}

func (as *AdminService) sendActivationEmail(admin *models.Admin) error {
	if as.ResendAPIKey == "" {
		fmt.Printf("[WARN] RESEND_API_KEY not configured. Skipping activation email for %s\n", admin.Email)
		return nil
	}

	if as.FrontendURL == "" {
		return fmt.Errorf("frontend URL is not configured for activation email")
	}

	activationURL := fmt.Sprintf("%s/?adminActivationToken=%s", as.FrontendURL, admin.ActivationToken)

	type resendPayload struct {
		From    string   `json:"from"`
		To      []string `json:"to"`
		Subject string   `json:"subject"`
		Html    string   `json:"html"`
		Text    string   `json:"text"`
	}

	payload := resendPayload{
		From:    "Clastra <no-reply@rech-it.com>",
		To:      []string{admin.Email},
		Subject: "Activate your Clastra admin account",
		Html:    fmt.Sprintf(`<p>Hello %s,</p><p>Please click the link below to set your password and activate your admin account:</p><p><a href="%s">Activate your account</a></p><p>If you did not request this account, please ignore this email.</p>`, admin.Name, activationURL),
		Text:    fmt.Sprintf("Hello %s,\n\nPlease open the following link to set your password and activate your admin account:\n%s\n\nIf you did not request this account, ignore this email.", admin.Name, activationURL),
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", as.ResendAPIKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send activation email: status %d", resp.StatusCode)
	}

	return nil
}
