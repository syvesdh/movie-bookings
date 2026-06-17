# Cinema Booking Platform — System Design

A scalable cinema booking system designed for high availability, low latency, and a strict guarantee that no two customers can book the same seat.

---

## 1. Database Schema

A relational database (PostgreSQL or MySQL) is recommended for complex relationships and ACID transactions — essential for preventing double-booking.

### `movies`

Stores the catalog of available movies.

| Column Name | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID / BIGINT | Unique identifier for the movie |
| `title` | VARCHAR(255) | Movie name |
| `description` | TEXT | Synopsis, cast, etc. |
| `trailer_url` | VARCHAR(512) | Link to the trailer |
| `genre` | VARCHAR(100) | Genre(s) |
| `release_date` | DATE | Movie release date |
| `duration` | INT | Duration in minutes |

### `shows`

Links a movie to a specific time slot and hall/screen.

| Column Name | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID / BIGINT | Unique identifier for the showtime |
| `movie_id` (FK) | UUID / BIGINT | References `movies.id` |
| `screen_name` | VARCHAR(50) | e.g., "Hall A", "IMAX Screen" |
| `start_time` | TIMESTAMP | Date and time the movie starts |
| `end_time` | TIMESTAMP | Date and time the movie ends |

### `seats`

The physical layout of the cinema.

| Column Name | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID / BIGINT | Unique identifier for the physical seat |
| `screen_name` | VARCHAR(50) | e.g., "Hall A" |
| `row_num` | VARCHAR(5) | e.g., "A", "B", "C" |
| `col_num` | INT | e.g., 1, 2, 3 |

### `show_seats` (Concurrency Control Table)

Tracks the dynamic state of a physical seat for a specific showtime.

| Column Name | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID / BIGINT | Unique identifier |
| `show_id` (FK) | UUID / BIGINT | References `shows.id` |
| `seat_id` (FK) | UUID / BIGINT | References `seats.id` |
| `status` | VARCHAR(20) | `AVAILABLE`, `LOCKED`, `BOOKED` |
| `version` | INT | Used for optimistic locking |

### `bookings`

Stores successful and pending bookings.

| Column Name | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID / BIGINT | Unique reservation ID |
| `user_id` | UUID / BIGINT | Unique identifier for the user |
| `show_id` (FK) | UUID / BIGINT | References `shows.id` |
| `total_price` | DECIMAL(10,2) | Total cost |
| `status` | VARCHAR(20) | `PENDING_PAYMENT`, `CONFIRMED`, `EXPIRED` |
| `created_at` | TIMESTAMP | Used to enforce the payment time limit |

### `booking_items`

Links a booking to the specific seats chosen.

| Column Name | Type | Description |
| --- | --- | --- |
| `booking_id` (FK) | UUID / BIGINT | References `bookings.id` |
| `show_seat_id` (FK) | UUID / BIGINT | References `show_seats.id` |

---

## 2. API Endpoints

### Public / Browsing Endpoints

**`GET /api/v1/movies`**
- Fetch a list of all currently available movies.
- Supports search filters: `?name=`, `?genre=`, `?release_date=`
- *Latency strategy:* Cache results in Redis.

**`GET /api/v1/movies/{movie_id}`**
- Get specific movie details, description, trailer URL, and its list of shows.

**`GET /api/v1/shows/{show_id}/seats`**
- Returns a seat map for the show and the availability status of each seat (`AVAILABLE`, `LOCKED`, `BOOKED`).

### Transactional / Booking Endpoints

**`POST /api/v1/bookings/lock`**
- Temporarily lock selected seats for a predefined time (e.g., 10 minutes) while the user completes payment.
- Request body:
  ```json
  { "show_id": "XYZ", "seat_ids": [101, 102] }
  ```
- Response:
  ```json
  { "booking_id": "ABC", "status": "PENDING_PAYMENT", "expires_at": "2026-06-17T18:05:00Z" }
  ```

**`POST /api/v1/bookings/{booking_id}/payment`**
- Process the secure financial transaction.
- Request body:
  ```json
  { "payment_token": "tok_123" }
  ```
- Response:
  ```json
  { "booking_id": "ABC", "status": "CONFIRMED" }
  ```

---

## 3. User Flow

```
[Main Page: List Movies]
       │
       ▼
[Select Movie → View Details & Showtimes]
       │
       ▼
[Select Showtime → View Seat Availability Layout]
       │
       ▼
[Select Seats & Click "Book"] ────► [System attempts to LOCK seats]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Success)                                 ▼ (Fail: Already Taken)
         [Show Timer: 10 Mins]                          [Prompt: "Seats no longer available"]
                       │                                           │
                       ▼                                           ▼
         [User Submits Payment]                          [Back to Seat Selection]
                       │
         ┌─────────────┴─────────────┐
         ▼ (Payment Success)         ▼ (Payment Fails / Timeout)
   [Status: CONFIRMED]         [Status: EXPIRED, Seats Released]
```

---

## 4. Core System Requirements

### 1. Preventing Double-Booking (Concurrency Control)

Use a **database-level transaction** with pessimistic locking on the `show_seats` table.

**Pessimistic Locking (recommended for high contention):** `SELECT ... FOR UPDATE` locks the target rows immediately so no other transaction can modify them until the current one commits or rolls back.

```sql
START TRANSACTION;

-- Lock the rows so no concurrent transaction can touch them
SELECT id FROM show_seats
WHERE show_id = :show_id AND id IN (:seat_ids) AND status = 'AVAILABLE'
FOR UPDATE;

-- If the count matches the number of requested seats, proceed
UPDATE show_seats SET status = 'LOCKED' WHERE id IN (:seat_ids);

INSERT INTO bookings (user_id, show_id, status, expires_at) VALUES (...);

COMMIT;
```

If any seat is already `LOCKED` or `BOOKED`, the row count from the `SELECT` will not match the request — the transaction is rolled back and the user is notified.

### 2. High Availability & Low Latency

- **Caching:** ~90% of traffic is read-heavy browsing (movies, showtimes, seat maps). Cache these responses in **Redis** to avoid hitting the primary database on every request.
- **Read replicas:** Route all `SELECT` queries for browsing to read replicas; reserve the primary database node for booking writes only.

### 3. Payment Time Limit (TTL Enforcement)

- When a booking is created, seats are set to `LOCKED` and a TTL is recorded on the booking (`expires_at`).
- Push a **delayed message** into a message queue (RabbitMQ, AWS SQS) scheduled to fire after the lock window (e.g., 10 minutes).
- A worker consumes the message and checks the booking status. If still `PENDING_PAYMENT`, it sets `show_seats.status` back to `AVAILABLE` and marks the booking as `EXPIRED`.

### 4. Secure Financial Transactions (PCI-DSS)

- Never handle raw card details on your own servers.
- Integrate a trusted payment gateway (Stripe, Adyen, etc.).
- The frontend tokenises the card directly with the gateway, producing a short-lived payment token.
- Your backend receives only the token and calls the gateway server-to-server to complete the charge — card data never touches your infrastructure.

---

## 5. Recommended Prototype Stack

For a prototype that needs to ship fast with a proper backend, SQL database, and REST API.

**The Stack: FastAPI + PostgreSQL + React (Vite)**

### Backend — FastAPI (Python)

FastAPI is the fastest path from zero to a working REST API. It auto-generates interactive Swagger docs at `/docs` the moment your server starts, has built-in request validation via Pydantic, and pairs naturally with SQLAlchemy as your ORM and Alembic for database migrations.

### Database — PostgreSQL

The safest choice for a prototype that might grow into production. Runs in Docker locally, and every major deployment platform (Railway, Render, Fly.io) has managed Postgres available with one click.

### Frontend — React + Vite

Vite gives you a nearly instant dev server with hot module reload. Pair it with React Query (TanStack Query) for data fetching and Tailwind CSS for styling — both have very shallow learning curves for prototyping.

### Local Dev — Docker Compose

One `docker-compose.yml` spins up all three services together. Your team can run `docker compose up` and have the full stack running locally in under a minute.

### Deployment — Railway (recommended for speed)

Connect your GitHub repo, add environment variables, and Railway detects FastAPI automatically. You get the backend, Postgres, and optionally the frontend all from one dashboard. Free tier is generous enough for a prototype.

### Project Structure

```
my-app/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── database.py      # DB connection
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── api/         # Axios/React Query hooks
│   └── package.json
└── docker-compose.yml
```
