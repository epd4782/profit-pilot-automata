
# 🚀 Trading Bot Deployment Guide

Vollständiges Deployment-Paket für den Trading Bot mit Docker, DigitalOcean und Railway Support.

## 📋 Voraussetzungen

### System-Anforderungen
- **RAM**: Mindestens 2GB (4GB empfohlen für Monitoring)
- **Storage**: 10GB freier Speicherplatz
- **CPU**: 1 vCPU (2 vCPU empfohlen)
- **OS**: Ubuntu 20.04+ oder Docker-kompatibles System

### Software-Anforderungen
- Docker & Docker Compose
- Git
- SSH-Zugang (für DigitalOcean)

## 🔧 Schnellstart (Lokal)

```bash
# 1. Repository klonen
git clone <your-repo-url>
cd trading-bot

# 2. Environment konfigurieren
cp .env.example .env.production
# Bearbeite .env.production mit deinen API-Keys

# 3. Bot starten
make build
make up

# 4. Status prüfen
make status
make logs
```

**Zugriff:**
- Trading Bot: http://localhost:3000
- Grafana: http://localhost:3001 (admin/trading123!)
- Prometheus: http://localhost:9090

## ☁️ Cloud Deployment

### Option 1: DigitalOcean (Empfohlen)

```bash
# 1. DigitalOcean CLI installieren
curl -L https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz | tar xz
sudo mv doctl /usr/local/bin

# 2. CLI konfigurieren
doctl auth init

# 3. SSH-Key erstellen
ssh-keygen -t rsa -b 4096 -f ~/.ssh/trading-bot-key
doctl compute ssh-key import trading-bot-key --public-key-file ~/.ssh/trading-bot-key.pub

# 4. Deploy-Skript anpassen
nano scripts/deploy-digitalocean.sh
# Ändere DOMAIN und andere Variablen

# 5. Deployment starten
make deploy-do
```

**Kosten:** ~$12/Monat für 2GB RAM Droplet

### Option 2: Railway

```bash
# 1. Railway CLI installieren
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deployment
make deploy-railway

# 4. Environment Variables setzen
# Über Railway Dashboard oder CLI:
railway variables set VITE_BINANCE_API_KEY=your_key
railway variables set VITE_BINANCE_SECRET_KEY=your_secret
```

**Kosten:** $5/Monat Starter Plan

## 🔐 Sicherheits-Setup

### API-Keys konfigurieren

1. **Binance API-Keys erstellen:**
   - Gehe zu [Binance API Management](https://www.binance.com/en/my/settings/api-management)
   - Erstelle neuen API-Key
   - Aktiviere nur "Spot Trading" (NICHT Futures/Options)
   - Füge Server-IP zur Whitelist hinzu

2. **Environment Variables setzen:**

```bash
# Für Staging/Testing (.env.staging)
VITE_BINANCE_TESTNET=true
VITE_ENABLE_REAL_TRADING=false

# Für Production (.env.production)
VITE_BINANCE_TESTNET=false
VITE_ENABLE_REAL_TRADING=true  # VORSICHT!
```

### Firewall Setup (DigitalOcean)

```bash
# Automatisch im Deploy-Skript enthalten:
ufw allow ssh
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 3000    # Trading Bot
ufw allow 3001    # Grafana
ufw allow 9090    # Prometheus
ufw enable
```

## 📊 Monitoring Setup

### Grafana Dashboards

1. **Zugriff:** http://your-server:3001
2. **Login:** admin / trading123!
3. **Dashboards importieren:**
   - Trading Bot Status
   - Performance Metrics
   - System Health

### Prometheus Metriken

```bash
# Custom Metriken hinzufügen
# Bearbeite monitoring/prometheus.yml
```

### Alerting Setup

```bash
# Monitoring-Infrastruktur einrichten
make setup-monitoring

# E-Mail/Slack Alerts konfigurieren
# Bearbeite monitoring/alerts/trading-bot-alerts.yml
```

## 💾 Backup & Recovery

### Automatische Backups

```bash
# Backup-Cron aktivieren (automatisch im Deploy-Skript)
crontab -e
# Füge hinzu: 0 3 * * * /opt/trading-bot/scripts/backup.sh

# Manuelles Backup
make backup
```

### Cloud-Backup (Optional)

```bash
# AWS S3 Backup
aws s3 sync /backups s3://your-backup-bucket

# Google Cloud Storage
gsutil -m rsync -r /backups gs://your-backup-bucket
```

## 🔄 Wartung & Updates

### Bot Updates

```bash
# Automatisches Update
make update

# Manuelles Update
git pull
make build
make restart
```

### Health Checks

```bash
# Bot-Status prüfen
make health

# System-Status prüfen
make status

# Logs anzeigen
make logs
```

### Troubleshooting

```bash
# Container-Status
docker ps

# Bot-Logs
docker-compose logs trading-bot

# System-Ressourcen
docker stats

# Backup wiederherstellen
tar -xzf backup-file.tar.gz
# Daten in entsprechende Verzeichnisse kopieren
make restart
```

## 💰 Kosten-Übersicht

| Service | Monatliche Kosten | Features |
|---------|------------------|----------|
| DigitalOcean | $12-24 | Volle Kontrolle, Root-Zugang |
| Railway | $5-20 | Managed, einfach zu deployen |
| AWS/GCP | $10-30 | Enterprise-Features |

## 🆘 Support & Troubleshooting

### Häufige Probleme

1. **API-Key Fehler:**
   ```bash
   # API-Keys prüfen
   make env-check
   # Bot-Logs für API-Fehler prüfen
   make logs
   ```

2. **Memory Issues:**
   ```bash
   # Memory-Usage prüfen
   docker stats
   # Container neustarten
   make restart
   ```

3. **Network Problems:**
   ```bash
   # Firewall prüfen
   ufw status
   # DNS testen
   nslookup api.binance.com
   ```

### Log-Analyse

```bash
# Bot-Logs filtern
docker-compose logs trading-bot | grep ERROR

# System-Logs
journalctl -u docker

# Network-Logs
netstat -tulpn
```

## 📞 Kontakt

Bei Problemen oder Fragen:
1. Logs sammeln: `make logs`
2. System-Status: `make status`
3. Backup erstellen: `make backup`
4. Issue mit Logs erstellen

---

**⚠️ WICHTIGER HINWEIS:**
Teste IMMER zuerst mit Testnet (VITE_BINANCE_TESTNET=true) bevor du auf Live-Trading umstellst!
