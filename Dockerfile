# ── Build stage ──────────────────────────────────────────────
FROM node:24.13.0-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:24.13.0-alpine AS production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
