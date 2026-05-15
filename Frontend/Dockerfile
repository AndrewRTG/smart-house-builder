# Folosim o imagine de Node.js pentru build
FROM node:20-alpine

# Setăm folderul de lucru în container
WORKDIR /app

# Copiem fișierele de dependențe
COPY package*.json ./

# Instalăm modulele necesare
RUN npm install

# Copiem restul codului sursă
COPY . .

# Expunem portul pe care rulează Vite (standard 5173)
EXPOSE 5173

# Comanda pentru a porni aplicația în mod dev, accesibilă din afara containerului
CMD ["npm", "run", "dev", "--", "--host"]