# 🚀 Manual de Despliegue en AWS - Commerce API

## Índice

1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Configuración de Red (VPC)](#3-configuración-de-red-vpc)
4. [Base de Datos con Amazon RDS](#4-base-de-datos-con-amazon-rds)
5. [Almacenamiento con S3](#5-almacenamiento-con-s3)
6. [Despliegue del Servidor](#6-despliegue-del-servidor)
7. [Configuración de Dominio y SSL](#7-configuración-de-dominio-y-ssl)
8. [Variables de Entorno y Secretos](#8-variables-de-entorno-y-secretos)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Monitoreo y Logging](#10-monitoreo-y-logging)
11. [Backups y Recuperación](#11-backups-y-recuperación)
12. [Escalabilidad](#12-escalabilidad)
13. [Seguridad](#13-seguridad)
14. [Estimación de Costos](#14-estimación-de-costos)
15. [Troubleshooting](#15-troubleshooting)
16. [Checklist de Despliegue](#16-checklist-de-despliegue)

---

## 1. Visión General de la Arquitectura

### Arquitectura Recomendada para Producción

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                        AWS Cloud                         │
                                    │                                                          │
    Internet                        │   ┌─────────────────────────────────────────────────┐   │
        │                           │   │                     VPC                          │   │
        │                           │   │                                                  │   │
        ▼                           │   │   ┌──────────────────────────────────────────┐  │   │
  ┌───────────┐                     │   │   │            Public Subnets                 │  │   │
  │  Route 53 │                     │   │   │                                           │  │   │
  │   (DNS)   │                     │   │   │  ┌─────────────┐    ┌─────────────┐      │  │   │
  └─────┬─────┘                     │   │   │  │    NAT      │    │    NAT      │      │  │   │
        │                           │   │   │  │  Gateway    │    │  Gateway    │      │  │   │
        ▼                           │   │   │  │   (AZ-a)    │    │   (AZ-b)    │      │  │   │
  ┌───────────┐                     │   │   │  └─────────────┘    └─────────────┘      │  │   │
  │CloudFront │                     │   │   │                                           │  │   │
  │   (CDN)   │                     │   │   └──────────────────────────────────────────┘  │   │
  └─────┬─────┘                     │   │                        │                        │   │
        │                           │   │                        ▼                        │   │
        ▼                           │   │   ┌──────────────────────────────────────────┐  │   │
  ┌───────────┐                     │   │   │           Private Subnets                 │  │   │
  │   ALB     │◄────────────────────┼───┼───┤                                           │  │   │
  │(Load Bal.)│                     │   │   │  ┌─────────────┐    ┌─────────────┐      │  │   │
  └─────┬─────┘                     │   │   │  │   ECS/EC2   │    │   ECS/EC2   │      │  │   │
        │                           │   │   │  │  (API AZ-a) │    │  (API AZ-b) │      │  │   │
        │                           │   │   │  └──────┬──────┘    └──────┬──────┘      │  │   │
        │                           │   │   │         │                  │              │  │   │
        │                           │   │   │         └────────┬─────────┘              │  │   │
        │                           │   │   │                  │                        │  │   │
        │                           │   │   │                  ▼                        │  │   │
        │                           │   │   │  ┌──────────────────────────────────┐    │  │   │
        │                           │   │   │  │         Amazon RDS                │    │  │   │
        │                           │   │   │  │    (PostgreSQL Multi-AZ)          │    │  │   │
        │                           │   │   │  │  ┌─────────┐    ┌─────────┐       │    │  │   │
        │                           │   │   │  │  │ Primary │    │ Standby │       │    │  │   │
        │                           │   │   │  │  │  (AZ-a) │◄──►│  (AZ-b) │       │    │  │   │
        │                           │   │   │  │  └─────────┘    └─────────┘       │    │  │   │
        │                           │   │   │  └──────────────────────────────────┘    │  │   │
        │                           │   │   │                                           │  │   │
        │                           │   │   └──────────────────────────────────────────┘  │   │
        │                           │   │                                                  │   │
        │                           │   └─────────────────────────────────────────────────┘   │
        │                           │                                                          │
        │                           │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
        │                           │   │      S3      │  │   Secrets    │  │  CloudWatch  │  │
        │                           │   │   (Images)   │  │   Manager    │  │   (Logs)     │  │
        │                           │   └──────────────┘  └──────────────┘  └──────────────┘  │
        │                           │                                                          │
        │                           └─────────────────────────────────────────────────────────┘
        │
        │
  ┌─────┴─────┐
  │  GitHub   │
  │  Actions  │
  │  (CI/CD)  │
  └───────────┘
```

### Opciones de Despliegue

| Opción | Complejidad | Costo | Escalabilidad | Recomendado para |
|--------|-------------|-------|---------------|------------------|
| **EC2 + RDS** | Media | $$ | Manual | MVP, control total |
| **Elastic Beanstalk** | Baja | $$ | Auto | Inicio rápido |
| **ECS Fargate** | Media-Alta | $$$ | Auto | Producción |
| **EKS (Kubernetes)** | Alta | $$$$ | Auto | Enterprise |
| **App Runner** | Muy Baja | $$ | Auto | Microservicios simples |

**Recomendación**: Para esta API, usaremos **ECS Fargate** o **Elastic Beanstalk** según el nivel de experiencia.

---

## 2. Requisitos Previos

### 2.1 Cuenta AWS
- Cuenta AWS activa con permisos de administrador
- AWS CLI instalado y configurado
- MFA habilitado en la cuenta root

### 2.2 Herramientas Locales

```bash
# Instalar AWS CLI
brew install awscli  # macOS
# o
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configurar credenciales
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1
# Default output format: json

# Verificar configuración
aws sts get-caller-identity

# Instalar Docker (para ECS)
brew install --cask docker  # macOS

# Instalar EB CLI (para Elastic Beanstalk)
pip install awsebcli
```

### 2.3 Preparar la Aplicación

```bash
# Verificar que la app funciona localmente
cd /path/to/commerce-api
pnpm install
pnpm run build
pnpm run start:prod
```

---

## 3. Configuración de Red (VPC)

### 3.1 Crear VPC con AWS Console

1. Ir a **VPC Dashboard** → **Create VPC**
2. Seleccionar **VPC and more** (wizard)
3. Configurar:

```yaml
Name tag: commerce-vpc
IPv4 CIDR block: 10.0.0.0/16
Number of Availability Zones: 2
Number of public subnets: 2
Number of private subnets: 2
NAT gateways: 1 per AZ (producción) o None (desarrollo)
VPC endpoints: S3 Gateway
```

### 3.2 Crear VPC con AWS CLI

```bash
# Crear VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=commerce-vpc}]'

# Guardar VPC ID
VPC_ID=vpc-xxxxxxxxx

# Habilitar DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Crear Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=commerce-igw}]'

IGW_ID=igw-xxxxxxxxx

# Attach Internet Gateway a VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Crear subnets públicas
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=commerce-public-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=commerce-public-1b}]'

# Crear subnets privadas
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=commerce-private-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=commerce-private-1b}]'
```

### 3.3 Security Groups

```bash
# Security Group para ALB (Load Balancer)
aws ec2 create-security-group \
  --group-name commerce-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID

ALB_SG=sg-xxxxxxxxx

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Security Group para API (ECS/EC2)
aws ec2 create-security-group \
  --group-name commerce-api-sg \
  --description "Security group for API servers" \
  --vpc-id $VPC_ID

API_SG=sg-xxxxxxxxx

# Solo permitir tráfico del ALB
aws ec2 authorize-security-group-ingress \
  --group-id $API_SG \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG

# Security Group para RDS
aws ec2 create-security-group \
  --group-name commerce-rds-sg \
  --description "Security group for RDS" \
  --vpc-id $VPC_ID

RDS_SG=sg-xxxxxxxxx

# Solo permitir tráfico de la API
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $API_SG
```

---

## 4. Base de Datos con Amazon RDS

### 4.1 Crear RDS PostgreSQL

#### Opción A: AWS Console

1. Ir a **RDS Dashboard** → **Create database**
2. Configurar:

```yaml
Engine: PostgreSQL
Version: 15.x (o la más reciente estable)
Template: Production (o Free tier para desarrollo)

# Identificación
DB instance identifier: commerce-db
Master username: postgres
Master password: [usar AWS Secrets Manager]

# Instancia
DB instance class: 
  - Desarrollo: db.t3.micro (Free tier)
  - Producción: db.t3.medium o db.r6g.large
Storage type: gp3
Allocated storage: 20 GB (mínimo)
Enable storage autoscaling: Sí
Maximum storage threshold: 100 GB

# Disponibilidad
Multi-AZ deployment: Sí (producción) / No (desarrollo)

# Conectividad
VPC: commerce-vpc
Subnet group: Crear nuevo con subnets privadas
Public access: No
VPC security group: commerce-rds-sg
Database port: 5432

# Autenticación
Password authentication

# Configuración adicional
Initial database name: commerce_db
DB parameter group: default.postgres15
Backup retention period: 7 días (producción: 30)
Enable deletion protection: Sí (producción)
Enable Performance Insights: Sí
```

#### Opción B: AWS CLI

```bash
# Crear subnet group para RDS
aws rds create-db-subnet-group \
  --db-subnet-group-name commerce-db-subnet-group \
  --db-subnet-group-description "Subnet group for Commerce DB" \
  --subnet-ids subnet-private-1a subnet-private-1b

# Crear instancia RDS
aws rds create-db-instance \
  --db-instance-identifier commerce-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password "$(aws secretsmanager get-random-password --password-length 32 --query RandomPassword --output text)" \
  --allocated-storage 20 \
  --max-allocated-storage 100 \
  --storage-type gp3 \
  --db-name commerce_db \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name commerce-db-subnet-group \
  --multi-az \
  --backup-retention-period 7 \
  --enable-performance-insights \
  --deletion-protection \
  --no-publicly-accessible \
  --tags Key=Environment,Value=production Key=Project,Value=commerce-api
```

### 4.2 Configurar Parameter Group (Optimización)

```bash
# Crear parameter group personalizado
aws rds create-db-parameter-group \
  --db-parameter-group-name commerce-postgres15-params \
  --db-parameter-group-family postgres15 \
  --description "Custom parameters for Commerce API"

# Configurar parámetros
aws rds modify-db-parameter-group \
  --db-parameter-group-name commerce-postgres15-params \
  --parameters \
    "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot" \
    "ParameterName=shared_buffers,ParameterValue={DBInstanceClassMemory/4},ApplyMethod=pending-reboot" \
    "ParameterName=work_mem,ParameterValue=16384,ApplyMethod=immediate" \
    "ParameterName=maintenance_work_mem,ParameterValue=512000,ApplyMethod=immediate" \
    "ParameterName=effective_cache_size,ParameterValue={DBInstanceClassMemory*3/4},ApplyMethod=immediate" \
    "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate"
```

### 4.3 Ejecutar Migraciones

```bash
# Obtener endpoint de RDS
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier commerce-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Configurar DATABASE_URL
export DATABASE_URL="postgresql://postgres:PASSWORD@${RDS_ENDPOINT}:5432/commerce_db"

# Ejecutar migraciones desde máquina con acceso (bastion o local con VPN)
npx prisma migrate deploy

# Ejecutar seed (opcional)
npx prisma db seed
```

### 4.4 Crear Read Replica (Producción de alto tráfico)

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier commerce-db-replica \
  --source-db-instance-identifier commerce-db \
  --db-instance-class db.t3.medium \
  --availability-zone us-east-1b
```

---

## 5. Almacenamiento con S3

### 5.1 Crear Bucket para Imágenes

```bash
# Crear bucket
aws s3api create-bucket \
  --bucket commerce-api-images-prod \
  --region us-east-1

# Habilitar versionado
aws s3api put-bucket-versioning \
  --bucket commerce-api-images-prod \
  --versioning-configuration Status=Enabled

# Configurar lifecycle (mover a Glacier después de 90 días)
aws s3api put-bucket-lifecycle-configuration \
  --bucket commerce-api-images-prod \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "MoveToGlacier",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "Transitions": [
          {"Days": 90, "StorageClass": "GLACIER"}
        ]
      }
    ]
  }'

# Bloquear acceso público
aws s3api put-public-access-block \
  --bucket commerce-api-images-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 5.2 Configurar CORS para S3

```bash
aws s3api put-bucket-cors \
  --bucket commerce-api-images-prod \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://tudominio.com", "https://admin.tudominio.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
      }
    ]
  }'
```

### 5.3 Crear CloudFront Distribution para S3

```bash
# Crear Origin Access Identity
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference=$(date +%s),Comment="Commerce API Images OAI"

# Crear distribución (usar Console es más fácil para esto)
```

---

## 6. Despliegue del Servidor

### 6.1 Opción A: ECS Fargate (Recomendado para Producción)

#### 6.1.1 Crear Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar pnpm y dependencias
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Generar Prisma Client y build
RUN pnpm prisma generate
RUN pnpm run build

# Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["node", "dist/main.js"]
```

#### 6.1.2 Crear ECR Repository

```bash
# Crear repositorio ECR
aws ecr create-repository \
  --repository-name commerce-api \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Obtener URL del repositorio
ECR_REPO=$(aws ecr describe-repositories \
  --repository-names commerce-api \
  --query 'repositories[0].repositoryUri' \
  --output text)

# Login a ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build y push
docker build -t commerce-api .
docker tag commerce-api:latest $ECR_REPO:latest
docker push $ECR_REPO:latest
```

#### 6.1.3 Crear ECS Cluster y Servicio

```bash
# Crear cluster
aws ecs create-cluster \
  --cluster-name commerce-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=1 \
    capacityProvider=FARGATE_SPOT,weight=4

# Crear CloudWatch Log Group
aws logs create-log-group --log-group-name /ecs/commerce-api

# Crear Task Definition (task-definition.json)
cat > task-definition.json << 'EOF'
{
  "family": "commerce-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "commerce-api",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/commerce-api:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:commerce/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:commerce/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/commerce-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Registrar task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Crear Application Load Balancer
aws elbv2 create-load-balancer \
  --name commerce-alb \
  --type application \
  --scheme internet-facing \
  --subnets subnet-public-1a subnet-public-1b \
  --security-groups $ALB_SG

ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names commerce-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Crear Target Group
aws elbv2 create-target-group \
  --name commerce-api-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30

TG_ARN=$(aws elbv2 describe-target-groups \
  --names commerce-api-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Crear Listener HTTPS (requiere certificado SSL)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Crear ECS Service
aws ecs create-service \
  --cluster commerce-cluster \
  --service-name commerce-api-service \
  --task-definition commerce-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-private-1a,subnet-private-1b],securityGroups=[$API_SG],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=commerce-api,containerPort=3000" \
  --health-check-grace-period-seconds 60
```

### 6.2 Opción B: Elastic Beanstalk (Más Simple)

#### 6.2.1 Preparar Aplicación

```bash
# Crear .ebextensions/options.config
mkdir -p .ebextensions

cat > .ebextensions/options.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm run start:prod"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 30
  aws:elasticbeanstalk:environment:
    LoadBalancerType: application
EOF

# Crear Procfile
echo "web: npm run start:prod" > Procfile

# Crear .ebignore
cat > .ebignore << 'EOF'
node_modules/
.git/
.env
*.log
dist/
coverage/
.nyc_output/
EOF
```

#### 6.2.2 Desplegar con EB CLI

```bash
# Inicializar aplicación EB
eb init commerce-api --platform "Node.js 20" --region us-east-1

# Crear ambiente de producción
eb create commerce-api-prod \
  --instance-type t3.small \
  --database.engine postgres \
  --database.instance db.t3.micro \
  --database.size 20 \
  --vpc.id $VPC_ID \
  --vpc.publicip \
  --vpc.ec2subnets subnet-private-1a,subnet-private-1b \
  --vpc.elbsubnets subnet-public-1a,subnet-public-1b \
  --vpc.securitygroups $API_SG \
  --envvars NODE_ENV=production,PORT=8080

# Desplegar
eb deploy commerce-api-prod

# Ver logs
eb logs

# Abrir en navegador
eb open
```

### 6.3 Opción C: EC2 Tradicional

#### 6.3.1 User Data Script

```bash
#!/bin/bash
yum update -y
yum install -y docker git

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Clonar repositorio
git clone https://github.com/tu-usuario/commerce-api.git /app
cd /app

# Configurar variables de entorno
aws secretsmanager get-secret-value --secret-id commerce/env --query SecretString --output text > .env

# Iniciar aplicación
docker-compose up -d
```

---

## 7. Configuración de Dominio y SSL

### 7.1 Registrar Dominio en Route 53

```bash
# Si el dominio ya está en Route 53, crear hosted zone
aws route53 create-hosted-zone \
  --name tudominio.com \
  --caller-reference $(date +%s)

HOSTED_ZONE_ID=Z0123456789
```

### 7.2 Solicitar Certificado SSL con ACM

```bash
# Solicitar certificado
aws acm request-certificate \
  --domain-name api.tudominio.com \
  --subject-alternative-names "*.tudominio.com" \
  --validation-method DNS \
  --region us-east-1

CERT_ARN=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxx

# Validar con DNS (obtener CNAME records)
aws acm describe-certificate --certificate-arn $CERT_ARN

# Crear registros DNS de validación en Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_abc123.api.tudominio.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_xyz789.acm-validations.aws."}]
      }
    }]
  }'
```

### 7.3 Crear Registro DNS para ALB

```bash
# Obtener DNS del ALB
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names commerce-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

ALB_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --names commerce-alb \
  --query 'LoadBalancers[0].CanonicalHostedZoneId' \
  --output text)

# Crear alias record
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.tudominio.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "'$ALB_ZONE_ID'",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

## 8. Variables de Entorno y Secretos

### 8.1 Crear Secretos en AWS Secrets Manager

```bash
# Crear secreto para DATABASE_URL
aws secretsmanager create-secret \
  --name commerce/database-url \
  --description "Database connection string" \
  --secret-string "postgresql://postgres:PASSWORD@commerce-db.xxx.us-east-1.rds.amazonaws.com:5432/commerce_db"

# Crear secreto para JWT
aws secretsmanager create-secret \
  --name commerce/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "$(openssl rand -base64 64)"

# Crear secreto para todas las variables de entorno
aws secretsmanager create-secret \
  --name commerce/env \
  --description "All environment variables" \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "JWT_SECRET": "...",
    "JWT_EXPIRES_IN": "7d",
    "STRIPE_SECRET_KEY": "sk_live_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "MERCADOPAGO_ACCESS_TOKEN": "...",
    "CLOUDINARY_CLOUD_NAME": "...",
    "CLOUDINARY_API_KEY": "...",
    "CLOUDINARY_API_SECRET": "...",
    "CORS_ORIGINS": "https://tudominio.com,https://admin.tudominio.com"
  }'
```

### 8.2 Crear IAM Role para acceder a Secrets

```bash
# Crear policy
cat > secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:commerce/*"
      ]
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name CommerceSecretsAccess \
  --policy-document file://secrets-policy.json

# Attach policy al rol de ECS
aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/CommerceSecretsAccess
```

### 8.3 Configurar Parameter Store (Alternativa)

```bash
# Guardar parámetros
aws ssm put-parameter \
  --name "/commerce/production/DATABASE_URL" \
  --value "postgresql://..." \
  --type SecureString \
  --key-id alias/aws/ssm

aws ssm put-parameter \
  --name "/commerce/production/JWT_SECRET" \
  --value "super-secret-key" \
  --type SecureString

# Leer parámetros
aws ssm get-parameters-by-path \
  --path "/commerce/production" \
  --with-decryption
```

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: commerce-api
  ECS_SERVICE: commerce-api-service
  ECS_CLUSTER: commerce-cluster
  CONTAINER_NAME: commerce-api

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linter
        run: pnpm run lint
        
      - name: Run tests
        run: pnpm run test
        
      - name: Build
        run: pnpm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
          
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition commerce-api \
            --query taskDefinition > task-definition.json
            
      - name: Update task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}
          
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
          
      - name: Run database migrations
        run: |
          # Ejecutar migraciones usando ECS run-task o Lambda
          aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition commerce-api-migrations \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

### 9.2 Configurar GitHub Secrets

En GitHub → Settings → Secrets and variables → Actions:

| Secret Name | Descripción |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | IAM Secret Key |

### 9.3 AWS CodePipeline (Alternativa)

```bash
# Crear CodePipeline via CloudFormation o Console
# - Source: GitHub (via CodeStar Connection)
# - Build: CodeBuild
# - Deploy: ECS Blue/Green o Rolling
```

---

## 10. Monitoreo y Logging

### 10.1 CloudWatch Logs

```bash
# Ver logs de ECS
aws logs tail /ecs/commerce-api --follow

# Crear filtro de métricas para errores
aws logs put-metric-filter \
  --log-group-name /ecs/commerce-api \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=CommerceAPI,metricValue=1
```

### 10.2 CloudWatch Alarms

```bash
# Alarma de CPU alto
aws cloudwatch put-metric-alarm \
  --alarm-name commerce-api-high-cpu \
  --alarm-description "CPU utilization exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ClusterName,Value=commerce-cluster Name=ServiceName,Value=commerce-api-service \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Alarma de errores 5xx
aws cloudwatch put-metric-alarm \
  --alarm-name commerce-api-5xx-errors \
  --alarm-description "High 5xx error rate" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=LoadBalancer,Value=app/commerce-alb/xxx \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Alarma de RDS
aws cloudwatch put-metric-alarm \
  --alarm-name commerce-db-connections \
  --alarm-description "Database connections high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 150 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=commerce-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

### 10.3 CloudWatch Dashboard

```bash
# Crear dashboard
aws cloudwatch put-dashboard \
  --dashboard-name CommerceAPI \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "x": 0, "y": 0, "width": 12, "height": 6,
        "properties": {
          "title": "API Requests",
          "metrics": [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/commerce-alb/xxx"]
          ],
          "period": 60,
          "stat": "Sum"
        }
      },
      {
        "type": "metric",
        "x": 12, "y": 0, "width": 12, "height": 6,
        "properties": {
          "title": "Response Time",
          "metrics": [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/commerce-alb/xxx"]
          ],
          "period": 60,
          "stat": "Average"
        }
      },
      {
        "type": "metric",
        "x": 0, "y": 6, "width": 12, "height": 6,
        "properties": {
          "title": "ECS CPU/Memory",
          "metrics": [
            ["AWS/ECS", "CPUUtilization", "ClusterName", "commerce-cluster", "ServiceName", "commerce-api-service"],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", "commerce-cluster", "ServiceName", "commerce-api-service"]
          ]
        }
      },
      {
        "type": "metric",
        "x": 12, "y": 6, "width": 12, "height": 6,
        "properties": {
          "title": "RDS Performance",
          "metrics": [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "commerce-db"],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "commerce-db"]
          ]
        }
      }
    ]
  }'
```

### 10.4 X-Ray (Tracing Distribuido)

```typescript
// Agregar en main.ts
import * as AWSXRay from 'aws-xray-sdk';

// Instrumentar AWS SDK
AWSXRay.captureAWS(require('aws-sdk'));

// Instrumentar HTTP
AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require('https'));

// Middleware
app.use(AWSXRay.express.openSegment('commerce-api'));
// ... rutas
app.use(AWSXRay.express.closeSegment());
```

---

## 11. Backups y Recuperación

### 11.1 RDS Automated Backups

```bash
# Verificar configuración de backups
aws rds describe-db-instances \
  --db-instance-identifier commerce-db \
  --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow}'

# Modificar retención de backups
aws rds modify-db-instance \
  --db-instance-identifier commerce-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

### 11.2 Snapshots Manuales

```bash
# Crear snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier commerce-db \
  --db-snapshot-identifier commerce-db-$(date +%Y%m%d)

# Listar snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier commerce-db \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}'

# Copiar snapshot a otra región (DR)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:ACCOUNT_ID:snapshot:commerce-db-xxx \
  --target-db-snapshot-identifier commerce-db-dr-copy \
  --source-region us-east-1 \
  --region us-west-2
```

### 11.3 Restaurar desde Backup

```bash
# Restaurar a punto en el tiempo
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier commerce-db \
  --target-db-instance-identifier commerce-db-restored \
  --restore-time "2026-01-29T12:00:00Z" \
  --db-instance-class db.t3.medium \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name commerce-db-subnet-group

# Restaurar desde snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier commerce-db-restored \
  --db-snapshot-identifier commerce-db-20260130 \
  --db-instance-class db.t3.medium \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name commerce-db-subnet-group
```

### 11.4 AWS Backup (Centralizado)

```bash
# Crear plan de backup
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "commerce-backup-plan",
    "Rules": [
      {
        "RuleName": "DailyBackup",
        "TargetBackupVaultName": "Default",
        "ScheduleExpression": "cron(0 3 * * ? *)",
        "StartWindowMinutes": 60,
        "CompletionWindowMinutes": 180,
        "Lifecycle": {
          "DeleteAfterDays": 30,
          "MoveToColdStorageAfterDays": 7
        }
      }
    ]
  }'
```

---

## 12. Escalabilidad

### 12.1 Auto Scaling para ECS

```bash
# Registrar scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/commerce-cluster/commerce-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Crear política de escalado por CPU
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/commerce-cluster/commerce-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'

# Crear política de escalado por requests
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/commerce-cluster/commerce-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name request-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 1000.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/commerce-alb/xxx/targetgroup/commerce-api-tg/xxx"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

### 12.2 Escalado de RDS

```bash
# Escalar verticalmente (cambiar instancia)
aws rds modify-db-instance \
  --db-instance-identifier commerce-db \
  --db-instance-class db.r6g.large \
  --apply-immediately

# Escalar storage
aws rds modify-db-instance \
  --db-instance-identifier commerce-db \
  --allocated-storage 100 \
  --apply-immediately
```

### 12.3 ElastiCache para Redis (Cache)

```bash
# Crear cluster de Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id commerce-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name commerce-cache-subnet-group \
  --security-group-ids $REDIS_SG

# Para producción: usar Replication Group
aws elasticache create-replication-group \
  --replication-group-id commerce-redis-cluster \
  --replication-group-description "Commerce API Redis Cluster" \
  --automatic-failover-enabled \
  --cache-node-type cache.r6g.large \
  --num-cache-clusters 2 \
  --cache-subnet-group-name commerce-cache-subnet-group \
  --security-group-ids $REDIS_SG
```

---

## 13. Seguridad

### 13.1 WAF (Web Application Firewall)

```bash
# Crear Web ACL
aws wafv2 create-web-acl \
  --name commerce-api-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=commerce-api-waf \
  --rules '[
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRuleSet"
      }
    },
    {
      "Name": "AWSManagedRulesSQLiRuleSet",
      "Priority": 2,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesSQLiRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "SQLiRuleSet"
      }
    },
    {
      "Name": "RateLimit",
      "Priority": 3,
      "Action": {"Block": {}},
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimit"
      }
    }
  ]'

# Asociar WAF al ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:ACCOUNT_ID:regional/webacl/commerce-api-waf/xxx \
  --resource-arn $ALB_ARN
```

### 13.2 AWS Shield (DDoS Protection)

```bash
# Shield Standard está habilitado automáticamente
# Para Shield Advanced (costo adicional):
aws shield create-protection \
  --name commerce-alb-protection \
  --resource-arn $ALB_ARN
```

### 13.3 IAM Best Practices

```bash
# Crear rol con mínimos privilegios para ECS
cat > ecs-task-role-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:commerce/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::commerce-api-images-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
EOF
```

### 13.4 Encriptación

```bash
# Verificar encriptación en RDS
aws rds describe-db-instances \
  --db-instance-identifier commerce-db \
  --query 'DBInstances[0].StorageEncrypted'

# Encriptar bucket S3
aws s3api put-bucket-encryption \
  --bucket commerce-api-images-prod \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "alias/aws/s3"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'
```

---

## 14. Estimación de Costos

### Desarrollo/Testing (us-east-1)

| Servicio | Configuración | Costo Mensual (USD) |
|----------|---------------|---------------------|
| RDS PostgreSQL | db.t3.micro, 20GB | $15 (Free Tier) |
| ECS Fargate | 0.5 vCPU, 1GB, 2 tasks | ~$30 |
| ALB | 1 LCU promedio | ~$25 |
| S3 | 10GB, 10K requests | ~$1 |
| CloudWatch | Logs 5GB | ~$3 |
| Data Transfer | 50GB | ~$5 |
| **Total** | | **~$80/mes** |

### Producción Básica

| Servicio | Configuración | Costo Mensual (USD) |
|----------|---------------|---------------------|
| RDS PostgreSQL | db.t3.medium, Multi-AZ, 50GB | ~$130 |
| ECS Fargate | 1 vCPU, 2GB, 3 tasks | ~$120 |
| ALB | 2 LCU promedio | ~$50 |
| S3 + CloudFront | 50GB, 1M requests | ~$15 |
| CloudWatch | Logs 20GB, dashboards | ~$15 |
| Secrets Manager | 5 secrets | ~$3 |
| Route 53 | 1 hosted zone | ~$1 |
| WAF | Basic rules | ~$10 |
| Data Transfer | 200GB | ~$18 |
| **Total** | | **~$360/mes** |

### Producción Enterprise

| Servicio | Configuración | Costo Mensual (USD) |
|----------|---------------|---------------------|
| RDS PostgreSQL | db.r6g.large, Multi-AZ, 200GB | ~$500 |
| RDS Read Replica | db.r6g.medium | ~$180 |
| ECS Fargate | 2 vCPU, 4GB, 6 tasks | ~$450 |
| ElastiCache Redis | cache.r6g.large, cluster | ~$300 |
| ALB | 5 LCU promedio | ~$100 |
| S3 + CloudFront | 200GB, 10M requests | ~$50 |
| CloudWatch + X-Ray | Full monitoring | ~$100 |
| WAF + Shield | Full protection | ~$50 |
| Data Transfer | 1TB | ~$90 |
| **Total** | | **~$1,800/mes** |

### Calculadora AWS
Use la [AWS Pricing Calculator](https://calculator.aws/#/) para estimaciones personalizadas.

---

## 15. Troubleshooting

### 15.1 La aplicación no arranca

```bash
# Verificar logs de ECS
aws logs tail /ecs/commerce-api --since 1h

# Verificar estado del servicio
aws ecs describe-services \
  --cluster commerce-cluster \
  --services commerce-api-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Events:events[:5]}'

# Verificar tasks fallidas
aws ecs list-tasks --cluster commerce-cluster --desired-status STOPPED
aws ecs describe-tasks --cluster commerce-cluster --tasks task-xxx
```

### 15.2 No puede conectar a la base de datos

```bash
# Verificar Security Groups
aws ec2 describe-security-groups --group-ids $API_SG $RDS_SG

# Verificar endpoint de RDS
aws rds describe-db-instances \
  --db-instance-identifier commerce-db \
  --query 'DBInstances[0].Endpoint'

# Testear conexión desde task (usar ECS Exec)
aws ecs execute-command \
  --cluster commerce-cluster \
  --task task-xxx \
  --container commerce-api \
  --interactive \
  --command "/bin/sh"

# Dentro del container:
nc -zv commerce-db.xxx.us-east-1.rds.amazonaws.com 5432
```

### 15.3 Alto tiempo de respuesta

```bash
# Verificar métricas de RDS
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=commerce-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average

# Verificar Performance Insights
aws pi get-resource-metrics \
  --service-type RDS \
  --identifier db-xxx \
  --metric-queries '[{"Metric": "db.load.avg"}]' \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --period-in-seconds 60
```

### 15.4 Errores 5xx frecuentes

```bash
# Revisar health checks
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN

# Revisar logs del ALB
# Habilitar access logs primero
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn $ALB_ARN \
  --attributes Key=access_logs.s3.enabled,Value=true \
              Key=access_logs.s3.bucket,Value=commerce-alb-logs \
              Key=access_logs.s3.prefix,Value=alb
```

### 15.5 Migraciones fallan

```bash
# Ejecutar migración manualmente
aws ecs run-task \
  --cluster commerce-cluster \
  --task-definition commerce-api-migrations \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET],securityGroups=[$API_SG]}" \
  --overrides '{
    "containerOverrides": [{
      "name": "commerce-api",
      "command": ["npx", "prisma", "migrate", "deploy"]
    }]
  }'

# Ver logs de la tarea de migración
aws logs tail /ecs/commerce-api --filter-pattern "prisma"
```

---

## 16. Checklist de Despliegue

### Pre-Despliegue

- [ ] VPC creada con subnets públicas y privadas
- [ ] Security Groups configurados correctamente
- [ ] RDS PostgreSQL creado y accesible
- [ ] Migraciones de base de datos ejecutadas
- [ ] Secrets almacenados en Secrets Manager
- [ ] Certificado SSL validado en ACM
- [ ] Imagen Docker construida y subida a ECR
- [ ] Task Definition creada con variables correctas
- [ ] IAM roles con permisos mínimos necesarios

### Despliegue

- [ ] ECS Service/EB Environment creado
- [ ] ALB configurado con HTTPS
- [ ] Health checks pasando
- [ ] DNS apuntando al ALB
- [ ] WAF configurado y asociado

### Post-Despliegue

- [ ] Verificar endpoints de API funcionando
- [ ] CloudWatch Alarms configuradas
- [ ] Dashboard de monitoreo activo
- [ ] Backups automáticos configurados
- [ ] Auto Scaling configurado
- [ ] CI/CD pipeline funcionando
- [ ] Documentación actualizada

### Validación de Seguridad

- [ ] HTTPS obligatorio
- [ ] Headers de seguridad (Helmet)
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] No hay credenciales en código
- [ ] Logs no exponen datos sensibles
- [ ] RDS no accesible públicamente
- [ ] Buckets S3 no públicos

---

## Recursos Adicionales

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Deployment Guides](https://www.prisma.io/docs/guides/deployment)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)

---

*Documento creado para Commerce API v0.0.1*
*Última actualización: Enero 30, 2026*
