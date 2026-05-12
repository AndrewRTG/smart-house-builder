# Ghid complet — Infrastructură AWS S3 cu Terraform

Acest ghid explică pas cu pas tot ce trebuie făcut pentru a configura stocarea imaginilor în AWS S3.

> **Cerință:** Cont AWS activ în organizație, autentificare cu email + parolă, acces la IAM Console.

---

## Ce creează acest modul Terraform

Terraform creează automat toată infrastructura AWS necesară:

| Resursă | Descriere |
|---|---|
| S3 Bucket | Spațiu de stocare pentru imagini (unul singur, partajat de toată echipa) |
| Bucket Policy | Permite citire publică a imaginilor (pentru afișare în browser) |
| CORS | Permite request-uri din frontend |
| IAM User | Utilizator dedicat pentru backend cu permisiuni minime |
| IAM Policy | PutObject, DeleteObject, GetObject, ListBucket doar pe acest bucket |
| Access Key | Credențialele pe care le folosește backend-ul |

**Flux upload imagine:**
1. Userul selectează o imagine în browser
2. Frontend trimite imaginea la backend (`POST /api/v1/images/avatars`)
3. Backend-ul o încarcă în S3 și primește un URL public
4. URL-ul se salvează în baza de date PostgreSQL
5. Frontend-ul afișează imaginea direct din S3

---



## 6. Configurare backend Spring Boot

> ✅ **Toți membrii echipei parcurg acest pas** (cu credențialele primite de la colegul care a rulat Terraform).

### Creează fișierul `.env`

Creează un fișier `.env` în folderul `Backend/` (în afara proiectului Java și a folderului Terraform, lângă `docker-compose.yml`):

```env
AWS_ACCESS_KEY=AKIA...
AWS_SECRET_KEY=...
AWS_REGION=eu-north-1
AWS_S3_BUCKET=smart-house-images-dev
```

### Configurare în IntelliJ IDEA

1. Click pe meniul dropdown de lângă butonul Run ▶ → **Edit Configurations...**
2. La **Environment variables** click pe iconița de folder 📁
3. Adaugă fișierul `.env` de mai sus
4. Click **OK** → **Apply** → repornește backend-ul

---

## 7. Verificare că totul funcționează

1. Pornește backend-ul și frontend-ul (`npm run dev`)
2. Loghează-te în aplicație
3. Mergi la **Profile → Settings → Change Photo**
4. Selectează o imagine (max 5 MB, jpeg/png/webp/gif)
5. Dacă funcționează, avatarul apare imediat în navbar și profil
6. În **AWS Console → S3 → bucket-ul vostru → avatars/** apare fișierul urcat

**Endpoint-uri disponibile:**

```
POST /api/v1/images/avatars   — upload avatar utilizator
POST /api/v1/images/articles  — upload imagine articol
```

Ambele acceptă `multipart/form-data` cu câmpul `file` și necesită JWT în header-ul `Authorization: Bearer <token>`.

---

## 8. Troubleshooting

**`Error: InvalidClientTokenId`**
Credențialele din `aws configure` sunt greșite sau expirate. Regenerează access key-ul (pasul 1) și reconfigurează CLI (pasul 3).

**`Error: BucketAlreadyExists`**
Bucket-ul a fost deja creat de un coleg. Nu trebuie să îl recreezi — cere-i credențialele și sari la pasul 6.

**`Error: AccessDenied` la terraform apply**
Userul tău AWS nu are permisiuni suficiente. Verifică că are `AdministratorAccess` atașat în IAM.

**`Error: AccessDenied` la upload imagine**
Variabilele de mediu nu sunt setate corect în backend. Verifică cele 4 variabile și repornește backend-ul.

**`net::ERR_CONNECTION_REFUSED` la upload**
Backend-ul nu rulează. Pornește-l din IntelliJ.

**`terraform: command not found`**
Terraform nu e în PATH. Pe Windows, verifică că `terraform.exe` e în `C:\Windows\System32\` sau adaugă folderul în variabila PATH.

**Imaginea nu apare după upload**
Verifică în AWS Console → S3 că fișierul există în bucket. Dacă există dar nu se afișează, bucket policy-ul public nu e aplicat — rulează din nou `terraform apply`.