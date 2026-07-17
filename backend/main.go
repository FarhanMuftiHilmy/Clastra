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

	"github.com/gorilla/mux"
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
	adminRepo := repository.NewPostgresAdminRepository(db)

	// 4. Initialize Services (inject repos)
	studentServ := service.NewStudentService(studentRepo, attendanceRepo)
	classServ := service.NewClassService(classRepo, studentRepo, attendanceRepo)
	teacherServ := service.NewTeacherService(teacherRepo, classRepo, cfg.ResendAPIKey, cfg.FrontendURL)
	attendanceServ := service.NewAttendanceService(attendanceRepo)
	adminServ := service.NewAdminService(adminRepo, cfg.ResendAPIKey, cfg.FrontendURL)
	authServ := service.NewAuthService(teacherRepo, adminRepo, cfg.JWTSecret)

	// 5. Initialize Controllers
	ctrl := handler.NewController(authServ, studentServ, classServ, teacherServ, attendanceServ, adminServ)

	// 6. Router Setup (Gorilla Mux)
	router := mux.NewRouter()

	// Public Routes
	router.HandleFunc("/api/v1/auth/login", ctrl.HandleLogin).Methods("POST")

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
	router.Handle("/api/v1/auth/logout", authChain(ctrl.HandleLogout)).Methods("POST")

	// Students Management
	router.Handle("/api/v1/students", staffChain(ctrl.HandleGetStudents)).Methods("GET")
	router.Handle("/api/v1/students/{id}", staffChain(ctrl.HandleGetStudentByID)).Methods("GET")
	router.Handle("/api/v1/students", adminChain(ctrl.HandleCreateStudent)).Methods("POST")
	router.Handle("/api/v1/students/{id}", adminChain(ctrl.HandleUpdateStudent)).Methods("PUT")
	router.Handle("/api/v1/students/{id}", adminChain(ctrl.HandleDeleteStudent)).Methods("DELETE")
	router.Handle("/api/v1/students/{id}/classes", adminChain(ctrl.HandleAssignStudentToClass)).Methods("POST")
	router.Handle("/api/v1/students/{id}/classes/{classId}", adminChain(ctrl.HandleRemoveStudentFromClass)).Methods("DELETE")
	router.Handle("/api/v1/students/{id}/classes", staffChain(ctrl.HandleGetStudentClasses)).Methods("GET")

	// Classes Management
	router.Handle("/api/v1/classes", staffChain(ctrl.HandleGetClasses)).Methods("GET")
	router.Handle("/api/v1/classes/{id}", staffChain(ctrl.HandleGetClassByID)).Methods("GET")
	router.Handle("/api/v1/classes", adminChain(ctrl.HandleCreateClass)).Methods("POST")
	router.Handle("/api/v1/classes/{id}", adminChain(ctrl.HandleUpdateClass)).Methods("PUT")
	router.Handle("/api/v1/classes/{id}", adminChain(ctrl.HandleDeleteClass)).Methods("DELETE")

	// Teachers Lookup
	router.Handle("/api/v1/teachers", staffChain(ctrl.HandleGetTeachers)).Methods("GET")
	router.Handle("/api/v1/teachers", adminChain(ctrl.HandleCreateTeacher)).Methods("POST")
	router.Handle("/api/v1/teachers/{id}", adminChain(ctrl.HandleUpdateTeacher)).Methods("PUT")
	router.Handle("/api/v1/teachers/{id}", adminChain(ctrl.HandleDeleteTeacher)).Methods("DELETE")
	router.Handle("/api/v1/teachers/activate", http.HandlerFunc(ctrl.HandleActivateTeacher)).Methods("POST")

	// Admins Management
	router.Handle("/api/v1/admins", adminChain(ctrl.HandleGetAdmins)).Methods("GET")
	router.Handle("/api/v1/admins/{id}", adminChain(ctrl.HandleGetAdminByID)).Methods("GET")
	router.Handle("/api/v1/admins", adminChain(ctrl.HandleCreateAdmin)).Methods("POST")
	router.Handle("/api/v1/admins/{id}", adminChain(ctrl.HandleUpdateAdmin)).Methods("PUT")
	router.Handle("/api/v1/admins/{id}", adminChain(ctrl.HandleDeleteAdmin)).Methods("DELETE")
	router.Handle("/api/v1/admins/activate", http.HandlerFunc(ctrl.HandleActivateAdmin)).Methods("POST")

	// Attendance Ledger
	router.Handle("/api/v1/attendance", staffChain(ctrl.HandleGetAttendance)).Methods("GET")
	router.Handle("/api/v1/attendance", staffChain(ctrl.HandleSubmitAttendance)).Methods("POST")
	router.Handle("/api/v1/attendance", staffChain(ctrl.HandleDeleteAttendance)).Methods("DELETE")

	// Wrap root router with global middlewares (Logger, CORS, Recovery)
	corsMiddleware := middleware.CORS(cfg.AllowedCORS)
	finalHandler := middleware.Recovery(middleware.Logger(corsMiddleware(router)))

	// 7. Start Server
	serverPort := cfg.Port
	log.Printf("[INFO] Go HTTP Server running on http://0.0.0.0:%s", serverPort)
	if err := http.ListenAndServe("0.0.0.0:"+serverPort, finalHandler); err != nil {
		log.Fatalf("[CRITICAL] Failed to start HTTP server: %v", err)
	}
}
