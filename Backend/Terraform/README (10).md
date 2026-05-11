# Ghid complet — Infrastructură AWS S3 cu Terraform

Acest ghid explică pas cu pas tot ce trebuie făcut pentru a configura stocarea imaginilor în AWS S3.

> **Cerință:** Cont AWS activ în organizație, autentificare cu email + parolă, acces la IAM Console.


## 1. Ce face acest modul Terraform

Terraform creează automat toată infrastructura AWS necesară:

| Resursă | Descriere |
|---|---|
| S3 Bucket | Spațiu de stocare pentru imagini |
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

## 2. Generare Access Key din AWS Console

Terraform rulează local și are nevoie de credențiale AWS pentru a putea crea resursele.

> ℹ️ **Cont de organizație:** Nu folosi contul root al organizației. Fie folosești userul tău personal din organizație (dacă are permisiuni de admin), fie creezi un user IAM nou dedicat pentru Terraform — ambele variante sunt descrise mai jos.

###  Generează Access Key pentru userul tău existent

Folosește această variantă dacă userul tău din organizație are permisiuni suficiente (AdministratorAccess sau permisiuni de S3 + IAM).

1. Loghează-te la **https://console.aws.amazon.com** cu email + parolă
2. Click pe **numele tău** (dreapta sus) → **Security credentials**
3. Scroll la secțiunea **Access keys**
4. Click **Create access key**
5. La **Use case** alege **Command Line Interface (CLI)**
6. Bifează confirmarea de jos → **Next** → **Create access key**

> ⚠️ Secretul se vede **o singură dată**. Copiază-l acum sau descarcă CSV-ul.

```
Access key ID:      AKIA...............
Secret access key:  wJalr...............
```


## 3. Instalare AWS CLI

### Windows

1. Descarcă: **https://awscli.amazonaws.com/AWSCLIV2.msi**
2. Rulează installerul (Next → Next → Install)
3. Verifică în PowerShell sau Command Prompt:

```powershell
aws --version
# aws-cli/2.x.x ...
```

### Mac

```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
aws --version
```

### Linux (Ubuntu/Debian)

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

---

## 4. Configurare AWS CLI

Deschide **PowerShell** / **Command Prompt** / **Terminal** și rulează:

```bash
aws configure
```

Completează cu valorile de la pasul 2:

```
AWS Access Key ID [None]:     AKIA...............
AWS Secret Access Key [None]: wJalr...............
Default region name [None]:   eu-north-1
Default output format [None]: json
```

**Verificare că funcționează:**

```bash
aws sts get-caller-identity
```

Ar trebui să returneze ceva de genul:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-admin"
}
```

Dacă apare eroare `InvalidClientTokenId` — access key-ul e greșit, repetă pasul 2.

---

## 5. Instalare Terraform

### Windows

**Cu Chocolatey** (dacă e instalat):
```powershell
choco install terraform
```

**Manual:**
1. Mergi la **https://developer.hashicorp.com/terraform/downloads**
2. Alege **Windows** → **AMD64** → descarcă `.zip`
3. Dezarhivează — vei obține `terraform.exe`
4. Mută `terraform.exe` în `C:\Windows\System32\`
5. Verifică:

```powershell
terraform --version
# Terraform v1.x.x
```

### Mac

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform --version
```

### Linux (Ubuntu/Debian)

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
terraform --version
```

---

## 6. Rulare Terraform

### Pasul 1 — Intră în folderul Terraform

```bash
cd Backend/Terraform
```

### Pasul 2 — Creează fișierul de configurare

```bash
# Mac/Linux
cp terraform.tfvars.example terraform.tfvars

# Windows
copy terraform.tfvars.example terraform.tfvars
```

Deschide `terraform.tfvars` și modifică valorile:

```hcl
aws_region        = "eu-north-1"               # regiunea contului vostru
bucket_name       = "smart-house-images-dev"   # TREBUIE să fie unic global în toată AWS
environment       = "dev"
enable_versioning = false

allowed_origins = [
  "http://localhost:5173",
]
```

> ⚠️ Dacă primești eroare că bucket-ul există deja, înseamnă că altcineva din lume are un bucket cu același nume. Adaugă un sufix unic, ex: `smart-house-images-grupA4-2026`.

### Pasul 3 — Inițializare

```bash
terraform init
```

Terraform descarcă provider-ul AWS. Ar trebui să apară:
```
Terraform has been successfully initialized!
```

### Pasul 4 — Previzualizare

```bash
terraform plan
```

Verifică că arată:
```
Plan: 7 to add, 0 to change, 0 to destroy.
```

### Pasul 5 — Aplicare

```bash
terraform apply
```

Tastează `yes` când te întreabă. Durează ~30 secunde.

La final vei vedea:

```
Outputs:

aws_access_key_id      = "AKIAZXOTZD5R..."
aws_secret_access_key  = <sensitive>
bucket_arn             = "arn:aws:s3:::smart-house-images-dev"
bucket_name            = "smart-house-images-dev"
bucket_regional_domain = "smart-house-images-dev.s3.eu-north-1.amazonaws.com"
iam_user_name          = "smart-house-images-dev-app-user"
```

### Pasul 6 — Obține credențialele pentru backend

```bash
terraform output aws_access_key_id
terraform output aws_secret_access_key
```

> ℹ️ Terraform a creat un user IAM nou (`smart-house-images-dev-app-user`) cu permisiuni minime, separat de userul de admin de la pasul 2. Folosește **credențialele acestui user nou** pentru backend — nu pe cele de admin.

---

## 7. Configurare backend Spring Boot

### IntelliJ IDEA (recomandat)

1. Click pe meniul dropdown de lângă butonul Run ▶ → **Edit Configurations...**
2. La **Environment variables** click pe iconița de folder 📁
3. Adaugă fisierul .env(e in Backend dar in afara proiectului java si Terraform(e langa ala cu docker)):

| Variabilă | Valoare |
|-----------|---------|
| `AWS_ACCESS_KEY` | valoarea din `terraform output aws_access_key_id` |
| `AWS_SECRET_KEY` | valoarea din `terraform output aws_secret_access_key` |
| `AWS_REGION` | `eu-north-1` (sau regiunea ta) |
| `AWS_S3_BUCKET` | `smart-house-images-dev` |

4. Click **OK** → **Apply** → repornește backend-ul

### .env

```cmd
AWS_ACCESS_KEY=AKIA...
AWS_SECRET_KEY=...
AWS_REGION=eu-north-1
 AWS_S3_BUCKET=smart-house-images-dev
```


## 8. Verificare că totul funcționează

1. Pornește backend-ul și frontend-ul (`npm run dev`)
2. Loghează-te în aplicație
3. Mergi la **Profile → Settings → Change Photo**
4. Selectează o imagine (max 5 MB, jpeg/png/webp/gif)
5. Dacă funcționează, avatarul apare imediat în navbar și profil
6. În **AWS Console → S3 → bucket-ul tău → avatars/** apare fișierul urcat

**Endpoint-uri disponibile:**

```
POST /api/v1/images/avatars   — upload avatar utilizator
POST /api/v1/images/articles  — upload imagine articol
```

Ambele acceptă `multipart/form-data` cu câmpul `file` și necesită JWT în header-ul `Authorization: Bearer <token>`.

---

---

## 10. Troubleshooting

**`Error: InvalidClientTokenId`**
Credențialele din `aws configure` sunt greșite sau expirate. Regenerează access key-ul (pasul 2) și reconfigurează CLI (pasul 4).

**`Error: BucketAlreadyExists`**
Schimbă `bucket_name` în `terraform.tfvars` cu un nume mai unic.

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
