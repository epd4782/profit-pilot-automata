
#!/bin/bash

# Monitoring Setup Script

set -e

echo "📊 Setting up monitoring infrastructure..."

# Create monitoring directories
mkdir -p monitoring/dashboards
mkdir -p monitoring/alerts

# Create Grafana dashboard
cat > monitoring/dashboards/trading-bot-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Trading Bot Dashboard",
    "tags": ["trading", "bot"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Bot Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"trading-bot\"}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {
                  "color": "red",
                  "value": 0
                },
                {
                  "color": "green",
                  "value": 1
                }
              ]
            }
          }
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

# Create alerting rules
cat > monitoring/alerts/trading-bot-alerts.yml << 'EOF'
groups:
  - name: trading-bot-alerts
    rules:
      - alert: TradingBotDown
        expr: up{job="trading-bot"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Trading Bot is down"
          description: "Trading Bot has been down for more than 1 minute"
      
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% for 5 minutes"
EOF

echo "✅ Monitoring setup completed"
echo "📊 Grafana dashboards created in monitoring/dashboards/"
echo "🚨 Alert rules created in monitoring/alerts/"
