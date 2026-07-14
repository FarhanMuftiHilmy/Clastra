package main

import (
	"database/sql"
	"log"
	"net/http"
	"scholasync/backend/config"
	"scholasync/backend/handler"
	"scholasync/backend/middleware"
	"scholasync/backend/models"
	"scholasync/backend/repository"
	"scholasync/backend/service"

	_ "github.com/lib/pq"
)

func main() {
	log.Printf("[INFO] Starting ScholaSync Go REST API Server...")

	// 1. Load Configurations
	cfg := config.Load()

	// 2. Open PostgreSQL Connection Pool
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[CRITICAL] Failed to open PostgreSQL connection: %v", err)
	}
	defer db.Close()

	// Verify database connection is alive
	if err := db.Ping(); err != nil {
		log.Printf("[WARNING] Database could not be reached via ping: %v. Server continuing to start.", err)
	} else {
		log.Printf("[INFO] Successfully connected to PostgreSQL Database.")
	}

	// 3. Initialize Repositories (PostgreSQL)
	studentRepo := repository.NewPostgresStudentRepository(db)
	classRepo := repository.NewPostgresClassRepository(db)
	teacherRepo := repository.NewPostgresTeacherRepository(db)
	attendanceRepo := repository.NewPostgresAttendanceRepository(db)

	// 4. Initialize Services (inject repos)
	studentServ := service.NewStudentService(studentRepo, attendanceRepo)
	classServ := service.NewClassService(classRepo, studentRepo, attendanceRepo)
	teacherServ := service.NewTeacherService(teacherRepo)
	attendanceServ := service.NewAttendanceService(attendanceRepo)
	authServ := service.NewAuthService(teacherRepo, cfg.JWTSecret)

	// 5. Initialize Controllers
	ctrl := handler.NewController(authServ, studentServ, classServ, teacherServ, attendanceServ)

	// 6. Router Setup (Go 1.22 Native Router)
	mux := http.NewServeMux()

	// Public Routes
	mux.HandleFunc("POST /api/v1/auth/login", ctrl.HandleLogin)

	// Authenticated Routes Chain
	authChain := func(h http.HandlerFunc) http.Handler {
		return middleware.Authenticate(authServ)(http.HandlerFunc(h))
	}

	// Authenticated and Authorized Admin Chain
	adminChain := func(h http.HandlerFunc) http.Handler {
		return middleware.Authenticate(authServ)(
			middleware.RequireRoles(models.RoleAdmin)(
				http.HandlerFunc(h),
			),
		)
	}

	// Authenticated and Authorized Admin/Teacher Chain
	staffChain := func(h http.HandlerFunc) http.Handler {
		return middleware.Authenticate(authServ)(
			middleware.RequireRoles(models.RoleAdmin, models.RoleTeacher)(
				http.HandlerFunc(h),
			),
		)
	}

	// Auth management
	mux.Handle("POST /api/v1/auth/logout", authChain(ctrl.HandleLogout))

	// Students Management
	mux.Handle("GET /api/v1/students", staffChain(ctrl.HandleGetStudents))
	mux.Handle("GET /api/v1/students/{id}", staffChain(ctrl.HandleGetStudentByID))
	mux.Handle("POST /api/v1/students", adminChain(ctrl.HandleCreateStudent))
	mux.Handle("PUT /api/v1/students/{id}", adminChain(ctrl.HandleUpdateStudent))
	mux.Handle("DELETE /api/v1/students/{id}", adminChain(ctrl.HandleDeleteStudent))

	// Classes Management
	mux.Handle("GET /api/v1/classes", staffChain(ctrl.HandleGetClasses))
	mux.Handle("GET /api/v1/classes/{id}", staffChain(ctrl.HandleGetClassByID))
	mux.Handle("POST /api/v1/classes", adminChain(ctrl.HandleCreateClass))
	mux.Handle("PUT /api/v1/classes/{id}", adminChain(ctrl.HandleUpdateClass))
	mux.Handle("DELETE /api/v1/classes/{id}", adminChain(ctrl.HandleDeleteClass))

	// Teachers Lookup
	mux.Handle("GET /api/v1/teachers", staffChain(ctrl.HandleGetTeachers))

	// Attendance Ledger
	mux.Handle("GET /api/v1/attendance", staffChain(ctrl.HandleGetAttendance))
	mux.Handle("POST /api/v1/attendance", staffChain(ctrl.HandleSubmitAttendance))

	// Wrap root router with global middlewares (Logger, CORS, Recovery)
	corsMiddleware := middleware.CORS(cfg.AllowedCORS)
	finalHandler := middleware.Recovery(middleware.Logger(corsMiddleware(mux)))

	// 7. Start Server
	serverPort := cfg.Port
	log.Printf("[INFO] Go HTTP Server running on http://0.0.0.0:%s", serverPort)
	if err := http.ListenAndServe("0.0.0.0:"+serverPort, finalHandler); err != nil {
		log.Fatalf("[CRITICAL] Failed to start HTTP server: %v", err)
	}
}
