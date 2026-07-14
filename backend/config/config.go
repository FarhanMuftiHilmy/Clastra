package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	AllowedCORS string
}

func Load() *Config {
	// Load environment variables from .env, if present.
	// Try both the current working directory and the repo root.
	if err := godotenv.Load(); err != nil {
		if err = godotenv.Load("../.env"); err != nil {
			log.Printf("[WARN] Could not load .env file: %v", err)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/scholasync?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "scholasync-super-secret-signature-key-2026"
	}

	cors := os.Getenv("ALLOWED_CORS")
	if cors == "" {
		cors = "http://localhost:3000"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
		AllowedCORS: cors,
	}
}
