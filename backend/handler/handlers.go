package handler

import (
	"encoding/json"
	"net/http"
	"scholasync/backend/models"
	"scholasync/backend/service"
)

type Controller struct {
	Auth       *service.AuthService
	Student    *service.StudentService
	Class      *service.ClassService
	Teacher    *service.TeacherService
	Attendance *service.AttendanceService
}

func NewController(
	auth *service.AuthService,
	student *service.StudentService,
	class *service.ClassService,
	teacher *service.TeacherService,
	attendance *service.AttendanceService,
) *Controller {
	return &Controller{
		Auth:       auth,
		Student:    student,
		Class:      class,
		Teacher:    teacher,
		Attendance: attendance,
	}
}

// Helpers
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeProblem(w http.ResponseWriter, path string, status int, title, detail string) {
	writeJSON(w, status, models.ProblemDetails{
		Type:     "https://scholasync.edu/errors/bad-request",
		Title:    title,
		Status:   status,
		Detail:   detail,
		Instance: path,
	})
}

// Handlers
func (c *Controller) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON authentication payload.")
		return
	}

	user, problem, err := c.Auth.Login(req)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Internal Server Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	// In production, set secure HttpOnly cookie
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    user.Token,
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: true,
		Secure:   false, // Set to true in prod HTTPS environment
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, cookie)

	writeJSON(w, http.StatusOK, user)
}

func (c *Controller) HandleLogout(w http.ResponseWriter, r *http.Request) {
	// Erase cookie
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, cookie)
	w.WriteHeader(http.StatusNoContent)
}

// Student handlers
func (c *Controller) HandleGetStudents(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	classID := r.URL.Query().Get("classId")

	students, err := c.Student.GetAll(search, classID)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, students)
}

func (c *Controller) HandleGetStudentByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	student, err := c.Student.GetByID(id)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	if student == nil {
		writeJSON(w, http.StatusNotFound, models.ProblemDetails{
			Type:     "https://scholasync.edu/errors/not-found",
			Title:    "Resource Not Found",
			Status:   http.StatusNotFound,
			Detail:   "No active student registered with the requested identifier.",
			Instance: r.URL.Path,
		})
		return
	}
	writeJSON(w, http.StatusOK, student)
}

func (c *Controller) HandleCreateStudent(w http.ResponseWriter, r *http.Request) {
	var s models.Student
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON student enrollment payload.")
		return
	}

	problem, err := c.Student.Create(&s)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Enrollment Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusCreated, s)
}

func (c *Controller) HandleUpdateStudent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var s models.Student
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON student modification payload.")
		return
	}
	s.ID = id

	problem, err := c.Student.Update(&s)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Modification Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusOK, s)
}

func (c *Controller) HandleDeleteStudent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := c.Student.Delete(id)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Deletion Error", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Classes Handlers
func (c *Controller) HandleGetClasses(w http.ResponseWriter, r *http.Request) {
	classes, err := c.Class.GetAll()
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, classes)
}

func (c *Controller) HandleGetClassByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	classData, err := c.Class.GetByID(id)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	if classData == nil {
		writeJSON(w, http.StatusNotFound, models.ProblemDetails{
			Type:     "https://scholasync.edu/errors/not-found",
			Title:    "Resource Not Found",
			Status:   http.StatusNotFound,
			Detail:   "No active class registered with the requested identifier.",
			Instance: r.URL.Path,
		})
		return
	}
	writeJSON(w, http.StatusOK, classData)
}

func (c *Controller) HandleCreateClass(w http.ResponseWriter, r *http.Request) {
	var cl models.Class
	if err := json.NewDecoder(r.Body).Decode(&cl); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON class registration payload.")
		return
	}

	problem, err := c.Class.Create(&cl)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Registration Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusCreated, cl)
}

func (c *Controller) HandleUpdateClass(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var cl models.Class
	if err := json.NewDecoder(r.Body).Decode(&cl); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON class modification payload.")
		return
	}
	cl.ID = id

	problem, err := c.Class.Update(&cl)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Modification Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusOK, cl)
}

func (c *Controller) HandleDeleteClass(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := c.Class.Delete(id)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Deletion Error", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Teacher handlers
func (c *Controller) HandleGetTeachers(w http.ResponseWriter, r *http.Request) {
	teachers, err := c.Teacher.GetAll()
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, teachers)
}

func (c *Controller) HandleCreateTeacher(w http.ResponseWriter, r *http.Request) {
	var teacher models.Teacher
	if err := json.NewDecoder(r.Body).Decode(&teacher); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON teacher registration payload.")
		return
	}

	problem, err := c.Teacher.Create(&teacher)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Registration Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusCreated, teacher)
}

func (c *Controller) HandleActivateTeacher(w http.ResponseWriter, r *http.Request) {
	var req models.TeacherActivationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON activation payload.")
		return
	}

	teacher, problem, err := c.Teacher.Activate(req.Token, req.Password)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Activation Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Account activated successfully.",
		"email":   teacher.Email,
	})
}

func (c *Controller) HandleUpdateTeacher(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var t models.Teacher
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON teacher modification payload.")
		return
	}
	t.ID = id

	problem, err := c.Teacher.Update(&t)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Modification Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (c *Controller) HandleDeleteTeacher(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := c.Teacher.Delete(id)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Deletion Error", err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Attendance handlers
func (c *Controller) HandleGetAttendance(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	date := r.URL.Query().Get("date")

	records, err := c.Attendance.GetAll(classID, date)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Database Read Error", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, records)
}

func (c *Controller) HandleSubmitAttendance(w http.ResponseWriter, r *http.Request) {
	var rec models.AttendanceRecord
	if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Malformed Payload", "Failed to deserialize JSON attendance submission.")
		return
	}

	problem, err := c.Attendance.Save(&rec)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Submission Error", err.Error())
		return
	}
	if problem != nil {
		writeJSON(w, problem.Status, problem)
		return
	}

	writeJSON(w, http.StatusOK, rec)
}

func (c *Controller) HandleDeleteAttendance(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	if classID == "" {
		writeProblem(w, r.URL.Path, http.StatusBadRequest, "Missing Parameters", "classId is required to delete attendance records.")
		return
	}

	err := c.Attendance.DeleteByClassID(classID)
	if err != nil {
		writeProblem(w, r.URL.Path, http.StatusInternalServerError, "Deletion Error", err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
