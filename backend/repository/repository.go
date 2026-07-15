package repository

import (
	"database/sql"
	"fmt"
	"scholasync/backend/models"
	"time"
)

// Repository Interfaces
type StudentRepository interface {
	GetAll(search, classID string) ([]models.Student, error)
	GetByID(id string) (*models.Student, error)
	Create(student *models.Student) error
	Update(student *models.Student) error
	Delete(id string) error
}

type ClassRepository interface {
	GetAll() ([]models.Class, error)
	GetByID(id string) (*models.Class, error)
	Create(classData *models.Class) error
	Update(classData *models.Class) error
	Delete(id string) error
}

type TeacherRepository interface {
	GetAll() ([]models.Teacher, error)
	GetByID(id string) (*models.Teacher, error)
	Create(teacher *models.Teacher) error
	GetByEmail(email string) (*models.Teacher, error)
}

type AttendanceRepository interface {
	GetAll(classID, date string) ([]models.AttendanceRecord, error)
	GetByClassAndDate(classID, date string) (*models.AttendanceRecord, error)
	Save(record *models.AttendanceRecord) error
	DeleteByClassID(classID string) error
	RemoveStudentFromRecords(studentID string) error
}

// Concrete Postgres Implementations
type PostgresStudentRepository struct {
	DB *sql.DB
}

func NewPostgresStudentRepository(db *sql.DB) StudentRepository {
	return &PostgresStudentRepository{DB: db}
}

func (r *PostgresStudentRepository) GetAll(search, classID string) ([]models.Student, error) {
	query := "SELECT id, name, roll_number, email, COALESCE(class_id, ''), gender FROM students WHERE 1=1"
	var args []interface{}
	argCount := 1

	if search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR roll_number ILIKE $%d OR email ILIKE $%d)", argCount, argCount+1, argCount+2)
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
		argCount += 3
	}

	if classID != "" {
		query += fmt.Sprintf(" AND class_id = $%d", argCount)
		args = append(args, classID)
		argCount++
	}

	query += " ORDER BY roll_number ASC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []models.Student
	for rows.Next() {
		var s models.Student
		if err := rows.Scan(&s.ID, &s.Name, &s.RollNumber, &s.Email, &s.ClassID, &s.Gender); err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}

func (r *PostgresStudentRepository) GetByID(id string) (*models.Student, error) {
	var s models.Student
	query := "SELECT id, name, roll_number, email, COALESCE(class_id, ''), gender FROM students WHERE id = $1"
	err := r.DB.QueryRow(query, id).Scan(&s.ID, &s.Name, &s.RollNumber, &s.Email, &s.ClassID, &s.Gender)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *PostgresStudentRepository) Create(s *models.Student) error {
	s.ID = fmt.Sprintf("std_%d", time.Now().UnixNano())
	query := "INSERT INTO students (id, name, roll_number, email, class_id, gender) VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6)"
	_, err := r.DB.Exec(query, s.ID, s.Name, s.RollNumber, s.Email, s.ClassID, s.Gender)
	return err
}

func (r *PostgresStudentRepository) Update(s *models.Student) error {
	query := "UPDATE students SET name = $1, roll_number = $2, email = $3, class_id = NULLIF($4, ''), gender = $5 WHERE id = $6"
	_, err := r.DB.Exec(query, s.Name, s.RollNumber, s.Email, s.ClassID, s.Gender, s.ID)
	return err
}

func (r *PostgresStudentRepository) Delete(id string) error {
	query := "DELETE FROM students WHERE id = $1"
	_, err := r.DB.Exec(query, id)
	return err
}

// Class Implementation
type PostgresClassRepository struct {
	DB *sql.DB
}

func NewPostgresClassRepository(db *sql.DB) ClassRepository {
	return &PostgresClassRepository{DB: db}
}

func (r *PostgresClassRepository) GetAll() ([]models.Class, error) {
	query := "SELECT id, name, grade, room, COALESCE(teacher_id, '') FROM classes ORDER BY name ASC"
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []models.Class
	for rows.Next() {
		var c models.Class
		if err := rows.Scan(&c.ID, &c.Name, &c.Grade, &c.Room, &c.TeacherID); err != nil {
			return nil, err
		}
		classes = append(classes, c)
	}
	return classes, nil
}

func (r *PostgresClassRepository) GetByID(id string) (*models.Class, error) {
	var c models.Class
	query := "SELECT id, name, grade, room, COALESCE(teacher_id, '') FROM classes WHERE id = $1"
	err := r.DB.QueryRow(query, id).Scan(&c.ID, &c.Name, &c.Grade, &c.Room, &c.TeacherID)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *PostgresClassRepository) Create(c *models.Class) error {
	c.ID = fmt.Sprintf("cls_%d", time.Now().UnixNano())
	query := "INSERT INTO classes (id, name, grade, room, teacher_id) VALUES ($1, $2, $3, $4, NULLIF($5, ''))"
	_, err := r.DB.Exec(query, c.ID, c.Name, c.Grade, c.Room, c.TeacherID)
	return err
}

func (r *PostgresClassRepository) Update(c *models.Class) error {
	query := "UPDATE classes SET name = $1, grade = $2, room = $3, teacher_id = NULLIF($4, '') WHERE id = $5"
	_, err := r.DB.Exec(query, c.Name, c.Grade, c.Room, c.TeacherID, c.ID)
	return err
}

func (r *PostgresClassRepository) Delete(id string) error {
	query := "DELETE FROM classes WHERE id = $1"
	_, err := r.DB.Exec(query, id)
	return err
}

// Teacher Implementation
type PostgresTeacherRepository struct {
	DB *sql.DB
}

func NewPostgresTeacherRepository(db *sql.DB) TeacherRepository {
	return &PostgresTeacherRepository{DB: db}
}

func (r *PostgresTeacherRepository) GetAll() ([]models.Teacher, error) {
	query := "SELECT id, name, email, subject FROM teachers ORDER BY name ASC"
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teachers []models.Teacher
	for rows.Next() {
		var t models.Teacher
		if err := rows.Scan(&t.ID, &t.Name, &t.Email, &t.Subject); err != nil {
			return nil, err
		}
		teachers = append(teachers, t)
	}
	return teachers, nil
}

func (r *PostgresTeacherRepository) GetByID(id string) (*models.Teacher, error) {
	var t models.Teacher
	query := "SELECT id, name, email, subject FROM teachers WHERE id = $1"
	err := r.DB.QueryRow(query, id).Scan(&t.ID, &t.Name, &t.Email, &t.Subject)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *PostgresTeacherRepository) Create(t *models.Teacher) error {
	t.ID = fmt.Sprintf("t_%d", time.Now().UnixNano())
	query := "INSERT INTO teachers (id, name, email, subject) VALUES ($1, $2, $3, $4)"
	_, err := r.DB.Exec(query, t.ID, t.Name, t.Email, t.Subject)
	return err
}

func (r *PostgresTeacherRepository) GetByEmail(email string) (*models.Teacher, error) {
	var t models.Teacher
	query := "SELECT id, name, email, subject FROM teachers WHERE email = $1"
	err := r.DB.QueryRow(query, email).Scan(&t.ID, &t.Name, &t.Email, &t.Subject)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &t, nil
}

// Attendance Implementation
type PostgresAttendanceRepository struct {
	DB *sql.DB
}

func NewPostgresAttendanceRepository(db *sql.DB) AttendanceRepository {
	return &PostgresAttendanceRepository{DB: db}
}

func (r *PostgresAttendanceRepository) GetAll(classID, date string) ([]models.AttendanceRecord, error) {
	query := "SELECT id, class_id, date, submitted_by, submitted_at FROM attendance_records WHERE 1=1"
	var args []interface{}
	argCount := 1

	if classID != "" {
		query += fmt.Sprintf(" AND class_id = $%d", argCount)
		args = append(args, classID)
		argCount++
	}

	if date != "" {
		query += fmt.Sprintf(" AND date = $%d", argCount)
		args = append(args, date)
		argCount++
	}

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.AttendanceRecord
	for rows.Next() {
		var rec models.AttendanceRecord
		var dateVal time.Time
		if err := rows.Scan(&rec.ID, &rec.ClassID, &dateVal, &rec.SubmittedBy, &rec.SubmittedAt); err != nil {
			return nil, err
		}
		rec.Date = dateVal.Format("2006-01-02")

		// Load students joins
		studentQuery := "SELECT student_id, status FROM attendance_student_joins WHERE attendance_id = $1"
		stRows, err := r.DB.Query(studentQuery, rec.ID)
		if err != nil {
			return nil, err
		}

		var statuses []models.StudentStatus
		for stRows.Next() {
			var st models.StudentStatus
			if err := stRows.Scan(&st.StudentID, &st.Status); err != nil {
				stRows.Close()
				return nil, err
			}
			statuses = append(statuses, st)
		}
		stRows.Close()
		rec.Students = statuses

		records = append(records, rec)
	}
	return records, nil
}

func (r *PostgresAttendanceRepository) GetByClassAndDate(classID, date string) (*models.AttendanceRecord, error) {
	query := "SELECT id, class_id, date, submitted_by, submitted_at FROM attendance_records WHERE class_id = $1 AND date = $2"
	var rec models.AttendanceRecord
	var dateVal time.Time
	err := r.DB.QueryRow(query, classID, date).Scan(&rec.ID, &rec.ClassID, &dateVal, &rec.SubmittedBy, &rec.SubmittedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	rec.Date = dateVal.Format("2006-01-02")

	// Load students joins
	studentQuery := "SELECT student_id, status FROM attendance_student_joins WHERE attendance_id = $1"
	rows, err := r.DB.Query(studentQuery, rec.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var statuses []models.StudentStatus
	for rows.Next() {
		var st models.StudentStatus
		if err := rows.Scan(&st.StudentID, &st.Status); err != nil {
			return nil, err
		}
		statuses = append(statuses, st)
	}
	rec.Students = statuses
	return &rec, nil
}

func (r *PostgresAttendanceRepository) Save(record *models.AttendanceRecord) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete existing header and cascading joins if any
	_, err = tx.Exec("DELETE FROM attendance_records WHERE class_id = $1 AND date = $2", record.ClassID, record.Date)
	if err != nil {
		return err
	}

	// 2. Insert header record
	record.ID = fmt.Sprintf("att_%s_%s", record.ClassID, record.Date)
	record.SubmittedAt = time.Now()
	headerQuery := "INSERT INTO attendance_records (id, class_id, date, submitted_by, submitted_at) VALUES ($1, $2, $3, $4, $5)"
	_, err = tx.Exec(headerQuery, record.ID, record.ClassID, record.Date, record.SubmittedBy, record.SubmittedAt)
	if err != nil {
		return err
	}

	// 3. Insert student statuses
	joinQuery := "INSERT INTO attendance_student_joins (attendance_id, student_id, status) VALUES ($1, $2, $3)"
	for _, st := range record.Students {
		_, err = tx.Exec(joinQuery, record.ID, st.StudentID, st.Status)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *PostgresAttendanceRepository) DeleteByClassID(classID string) error {
	query := "DELETE FROM attendance_records WHERE class_id = $1"
	_, err := r.DB.Exec(query, classID)
	return err
}

func (r *PostgresAttendanceRepository) RemoveStudentFromRecords(studentID string) error {
	query := "DELETE FROM attendance_student_joins WHERE student_id = $1"
	_, err := r.DB.Exec(query, studentID)
	return err
}
