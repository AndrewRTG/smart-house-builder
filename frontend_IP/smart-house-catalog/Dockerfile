# === ETAPA 1: Construirea (Build) ===
FROM node:20-alpine AS build
WORKDIR /app

# Copiem doar fisierele de configurare pentru instalare rapida
COPY package*.json ./
RUN npm install

# Copiem restul codului si il transformam in HTML/CSS/JS pur
COPY . .
RUN npm run build

# === ETAPA 2: Productie (Servirea fisierelor) ===
FROM nginx:alpine

# Luam rezultatul din etapa 1 (folderul dist) si il punem in serverul web
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]