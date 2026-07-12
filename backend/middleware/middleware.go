package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"scholasync/backend/models"
	"scholasync/backend/service"
	"strings"
	"time"
)

type contextKey string

const ClaimsKey contextKey = "jwt_claims"

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("[INFO] %s %s Started from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
		log.Printf("[INFO] %s %s Completed in %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func CORS(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[ERROR] Panic recovered: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/internal-error",
					Title:    "Internal Server Error",
					Status:   500,
					Detail:   "An unexpected structural failure occurred inside the system database or backend server.",
					Instance: r.URL.Path,
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func Authenticate(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			var tokenString string

			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				// Fallback to cookie
				cookie, err := r.Cookie("access_token")
				if err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/unauthorized",
					Title:    "Unauthorized Access",
					Status:   401,
					Detail:   "A valid JWT token is required inside authentication headers or secure cookies to access this endpoint.",
					Instance: r.URL.Path,
				})
				return
			}

			claims, err := authService.ValidateToken(tokenString)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/unauthorized",
					Title:    "Unauthorized Access",
					Status:   401,
					Detail:   "The provided session token is expired, corrupt, or invalid.",
					Instance: r.URL.Path,
				})
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRoles(permittedRoles ...models.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claimsVal := r.Context().Value(ClaimsKey)
			if claimsVal == nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/unauthorized",
					Title:    "Unauthorized Request",
					Status:   401,
					Detail:   "The session identity context could not be resolved from claims mappings.",
					Instance: r.URL.Path,
				})
				return
			}

			claims := claimsVal.(*map[string]interface{})
			roleVal, ok := (*claims)["role"].(string)
			if !ok {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/forbidden",
					Title:    "Forbidden Access",
					Status:   403,
					Detail:   "No role definition was declared inside active authorization claims.",
					Instance: r.URL.Path,
				})
				return
			}

			rolePermitted := false
			for _, permitted := range permittedRoles {
				if string(permitted) == roleVal {
					rolePermitted = true
					break
				}
			}

			if !rolePermitted {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(models.ProblemDetails{
					Type:     "https://scholasync.edu/errors/forbidden",
					Title:    "Forbidden Access",
					Status:   403,
					Detail:   "Your active user role does not hold sufficient privileges to perform this transaction.",
					Instance: r.URL.Path,
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
