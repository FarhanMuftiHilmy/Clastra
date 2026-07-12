# Multi-stage production build for Go REST API Backend
# Stage 1: Compiler
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git gcc musl-dev
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main main.go

# Stage 2: Runtime Environment
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata curl
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/db/migrations ./db/migrations
COPY --from=builder /app/db/seeds ./db/seeds
EXPOSE 8080
ENTRYPOINT ["./main"]
