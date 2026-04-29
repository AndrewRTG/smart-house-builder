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

# Ștergem configurația standard a Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiem fișierul nostru de configurare în locul celui standard
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiem fișierul build-uit din prima etapă
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]