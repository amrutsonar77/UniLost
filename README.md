# 🎓 UniLost - Lost & Found Platform for University Students

A simple college mini-project that lets students report and search for
lost/found items on campus, with a basic "AI" text-similarity engine that
suggests possible matches.

Built with:
- **Backend:** Java, Spring Boot, Spring Data JPA
- **Database:** MySQL
- **Frontend:** Plain HTML, CSS, JavaScript + Bootstrap 5 (no frameworks)

---

## 1. Project Structure

```
unilost/
├── pom.xml
├── schema.sql                     <- reference SQL (tables auto-created by Hibernate)
├── uploads/                       <- uploaded item images get saved here
└── src/main/
    ├── java/com/unilost/
    │   ├── UnilostApplication.java     <- main() entry point
    │   ├── config/WebConfig.java       <- serves /uploads, enables CORS
    │   ├── entity/                     <- User, LostItem, FoundItem, Match
    │   ├── repository/                 <- Spring Data JPA repositories
    │   ├── service/MatchingService.java<- the "AI" similarity engine
    │   ├── controller/                 <- REST API endpoints
    │   └── util/                       <- password hashing, file storage
    └── resources/
        ├── application.properties      <- DB connection settings
        └── static/                      <- all frontend pages (HTML/CSS/JS)
            ├── index.html, login.html, register.html
            ├── report-lost.html, report-found.html
            ├── lost-items.html, found-items.html
            ├── matches.html, admin.html
            ├── css/style.css
            └── js/*.js
```

---

## 2. Requirements

- Java 17+
- Maven 3.8+
- MySQL Server 8.x (running locally)

---

## 3. Setup Steps

### Step 1 - Create the MySQL database
You don't have to create it manually - the app will create `unilost_db`
automatically on first run (see `application.properties`). But make sure
MySQL server itself is running.

### Step 2 - Update database credentials
Open `src/main/resources/application.properties` and set your own
MySQL username/password:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

### Step 3 - Build and run the project

```bash
cd unilost
mvn spring-boot:run
```

Or build a runnable jar:

```bash
mvn clean package
java -jar target/unilost.jar
```

The server starts at: **http://localhost:8080**

Hibernate will automatically create the 4 tables (`users`, `lost_items`,
`found_items`, `matches`) inside `unilost_db` the first time it runs.

### Step 4 - Open the app
Go to `http://localhost:8080` in your browser. That's it - frontend and
backend run from the same Spring Boot server (no separate frontend server
needed).

---

## 4. How to Create an Admin Account

By default every new registration is a normal `STUDENT`. To test the
**Admin Page**:

1. Register a normal account from the Register page (e.g. `admin@uni.edu`).
2. Open MySQL and run:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@uni.edu';
   ```
3. Log out and log back in with that account. You'll now see an **Admin**
   link in the navbar.

---

## 5. How the "AI" Matching Works

See `MatchingService.java` for full comments. In short:

1. The item name and description of a Lost Item and a Found Item are
   broken into lowercase words (tokens).
2. **Jaccard Similarity** is used to measure how many words they share.
3. Item name similarity is weighted 60%, description 30%, and an extra
   10% bonus is given if the reported locations match exactly.
4. The final number (0-100) is shown as the **Match Score %**.

This is a simplified, rule-based algorithm built for demonstration
purposes in a college project - not a real machine learning model.

You can test it by:
1. Reporting a Lost Item, e.g. "Black Boat Earphones".
2. Reporting a Found Item, e.g. "Black Wireless Earphones".
3. Going to the Lost Items page and clicking **"Find AI Matches"** on
   that item, OR going to the Match Results page and clicking
   **"Generate Matches (All Items)"**.

---

## 6. Main Pages / Features

| Page | Feature |
|---|---|
| Home | Landing page + quick search |
| Register / Login | Student authentication |
| Report Lost Item | Form with image upload |
| Report Found Item | Form with image upload |
| Lost Items List | Browse + search lost reports |
| Found Items List | Browse + search found reports |
| Match Results | AI-suggested Lost ↔ Found matches |
| Admin Page | View stats, manage users/items |

---

## 7. Notes for Viva / Demonstration

- Passwords are stored as SHA-256 hashes (not plain text) - see
  `util/PasswordUtil.java`.
- Login state is kept in the browser's `localStorage` (simple approach,
  good enough for a demo - no JWT/session tokens used).
- Uploaded images are stored in the local `uploads/` folder and served
  back through Spring's static resource handler.
- All REST endpoints are under `/api/...` — you can test them directly
  with Postman if needed (e.g. `GET http://localhost:8080/api/lost-items`).

---

## 8. What's New (v2 Upgrade)

The project was extended with several new modules on top of the original
report/search/AI-match/admin features. Nothing old was removed - these
are additions:

| Feature | Where |
|---|---|
| Internal messaging (Contact Owner/Finder) | `messages.html`, `MessageController`, `Conversation`/`Message` tables |
| Item Details page | `item-details.html` |
| Item categories | `category` column on `lost_items`/`found_items`, category dropdowns |
| Search + filters (keyword, category, location) | `/api/lost-items/search`, `/api/found-items/search` |
| My Reports (view/edit/delete/mark recovered) | `my-reports.html` |
| Claim requests on found items | `item-details.html`, `ClaimController`, `claim_requests` table |
| Improved AI match display (text similarity, confidence badge, progress bar) | `matches.html`, `item-details.html` |
| Notification bell (AI match, message, claim events) | navbar bell icon, `NotificationController`, `notifications` table |
| Profile page | `profile.html` |
| Expanded Admin dashboard (recovered count, pending claims, claims tab) | `admin.html` |

**No manual database migration needed.** Because
`spring.jpa.hibernate.ddl-auto=update` is already set, Hibernate will
automatically add the new tables (`conversations`, `messages`,
`claim_requests`, `notifications`) and the new columns (`category` on
items, `college_name` on users) to your existing `unilost_db` the next
time you start the app. Your existing data is preserved.

If you'd rather see the SQL yourself first, the updated `schema.sql` in
the project root documents every table and column.

**Build/run check:** after pulling these changes, just restart with
`mvn spring-boot:run` as usual — no new dependencies were added to
`pom.xml`, so no extra downloads are required.
