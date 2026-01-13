# Synerex OneForm - Port Restructuring Plan

## 🎯 Goals
- **Reliability**: Better service isolation and failure recovery
- **Performance**: Optimized resource allocation and load balancing
- **Maintainability**: Clear service boundaries and standardized ports
- **Scalability**: Easy horizontal scaling and service discovery

## 📊 Current vs Recommended Structure

### Current Structure (Issues)
```
Port 8000: Main App (Development)
Port 8000: Main App (Production)
Port 8101: PDF Service (Envelope)
Port 8102: PDF Service (Standard)
Port 8200: Weather Service
Port 8201: Chart Service
Port 8080: Unknown Service
```

**Problems:**
- ❌ Inconsistent port ranges
- ❌ No clear service hierarchy
- ❌ Mixed development/production ports
- ❌ No load balancing
- ❌ No health monitoring
- ❌ No service discovery

### Recommended Structure

#### Core Services (8000-8099)
```
Port 8000: Main Application (Primary)
Port 8001: Main Application (Secondary/Backup)
Port 8002: API Gateway/Load Balancer
Port 8003: Health Check Service
```

#### PDF Services (8100-8199)
```
Port 8100: PDF Service (Primary)
Port 8101: PDF Service (Envelope Reports)
Port 8102: PDF Service (Standard Reports)
Port 8103: PDF Service (Backup)
```

#### Utility Services (8200-8299)
```
Port 8200: Weather Service
Port 8201: Chart Service
Port 8202: File Processing Service
Port 8203: Data Analysis Service
```

#### Monitoring & Management (8300-8399)
```
Port 8300: Service Discovery
Port 8301: Health Monitoring
Port 8302: Log Aggregation
Port 8303: Metrics Collection
```

## 🏗️ Implementation Strategy

### Phase 1: Core Restructuring
1. **Consolidate Main Application**
   - Move to port 8000 (primary)
   - Set up port 8001 (backup)
   - Implement health checks

2. **API Gateway Implementation**
   - Port 8002 for load balancing
   - Route requests to appropriate services
   - Implement circuit breakers

### Phase 2: Service Optimization
1. **PDF Services Consolidation**
   - Merge 8083/8084 into unified service on 8100
   - Implement service variants on 8101/8102
   - Add backup service on 8103

2. **Utility Services Organization**
   - Move weather service to 8200
   - Move chart service to 8201
   - Add new utility services

### Phase 3: Monitoring & Reliability
1. **Health Monitoring**
   - Centralized health checks on 8301
   - Service discovery on 8300
   - Automated failover

2. **Load Balancing**
   - Implement nginx/HAProxy on port 8002
   - Distribute load across services
   - Handle service failures gracefully

## 🔧 Technical Implementation

### 1. Nginx Configuration
```nginx
upstream main_app {
    server localhost:8000 weight=3;
    server localhost:8001 weight=1 backup;
}

upstream pdf_services {
    server localhost:8100 weight=2;
    server localhost:8101 weight=1;
    server localhost:8102 weight=1;
}

server {
    listen 8002;
    
    location / {
        proxy_pass http://main_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/pdf/ {
        proxy_pass http://pdf_services;
    }
}
```

### 2. Service Discovery
```python
# service_registry.py
SERVICES = {
    'main_app': {
        'primary': 'localhost:8000',
        'backup': 'localhost:8001',
        'health_check': '/health'
    },
    'pdf_service': {
        'primary': 'localhost:8100',
        'variants': ['localhost:8101', 'localhost:8102'],
        'backup': 'localhost:8103'
    }
}
```

### 3. Health Monitoring
```python
# health_monitor.py
import requests
import time

def check_service_health(service_url):
    try:
        response = requests.get(f"{service_url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def monitor_services():
    for service_name, config in SERVICES.items():
        is_healthy = check_service_health(config['primary'])
        if not is_healthy and 'backup' in config:
            # Failover to backup
            failover_to_backup(service_name, config['backup'])
```

## 📈 Performance Benefits

### Before Restructuring
- ❌ Single point of failure
- ❌ No load distribution
- ❌ Manual service management
- ❌ Inconsistent port usage
- ❌ No health monitoring

### After Restructuring
- ✅ High availability with backups
- ✅ Load balancing across services
- ✅ Automated service management
- ✅ Standardized port ranges
- ✅ Comprehensive health monitoring
- ✅ Easy horizontal scaling
- ✅ Service discovery
- ✅ Circuit breaker patterns

## 🚀 Migration Steps

### Step 1: Prepare New Structure
1. Create new service configurations
2. Set up nginx/HAProxy
3. Implement health monitoring
4. Create service discovery

### Step 2: Gradual Migration
1. Start new services on new ports
2. Test functionality
3. Update client configurations
4. Switch traffic gradually

### Step 3: Cleanup
1. Stop old services
2. Remove old configurations
3. Update documentation
4. Monitor performance

## 🔍 Monitoring & Maintenance

### Health Checks
- Service availability monitoring
- Response time tracking
- Error rate monitoring
- Resource usage tracking

### Automated Recovery
- Auto-restart failed services
- Failover to backup services
- Load redistribution
- Alert notifications

### Performance Metrics
- Request/response times
- Throughput rates
- Error rates
- Resource utilization

## 📋 Implementation Checklist

- [ ] Design new port structure
- [ ] Create nginx configuration
- [ ] Implement service discovery
- [ ] Set up health monitoring
- [ ] Create backup services
- [ ] Test failover scenarios
- [ ] Update client configurations
- [ ] Migrate services gradually
- [ ] Monitor performance
- [ ] Clean up old services
- [ ] Update documentation












