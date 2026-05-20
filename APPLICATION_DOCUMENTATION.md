# RSM HMS: Complete User Documentation
**Version 1.0 | Enterprise Hospital Management System**

This comprehensive guide provides end-to-end documentation for the RSM HMS (Hospital Management System), covering all user roles, workflows, and system capabilities.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Clinical Workflows](#clinical-workflows)
5. [Administrative Functions](#administrative-functions)
6. [Financial Operations](#financial-operations)
7. [System Administration](#system-administration)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## 🏥 System Overview

RSM HMS is a comprehensive, FHIR-native, multi-tenant hospital management system designed for modern healthcare facilities. It integrates electronic health records (EHR), practice management, patient engagement, and revenue cycle management into a unified platform.

### Key Features
- **Multi-tenant Architecture**: Support for multiple hospitals/facilities
- **Role-based Access Control (RBAC)**: Granular permissions for different user types
- **Real-time Dashboards**: Role-specific views with actionable insights
- **Unified Patient Workspace**: 3-panel interface for comprehensive patient care
- **HIPAA Compliant**: Built-in audit logging and data encryption
- **Mobile Responsive**: Works on tablets and mobile devices
- **API-First Design**: RESTful APIs for integrations

### System Architecture
- **Frontend**: React.js with Vite, Tailwind CSS
- **Backend**: NestJS (Node.js) with TypeScript
- **Database**: SQLite (development) / PostgreSQL (production)
- **Cache**: Redis (optional, with mock support)
- **Authentication**: JWT with HttpOnly cookies

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for database)
- Modern web browser

### Installation and Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd next-gen-hms
   ```

2. **Start the Database**
   ```bash
   cd services/clinical-service
   docker compose up -d
   ```

3. **Configure Environment**
   The system auto-configures for development. Key settings in `.env`:
   - `NODE_ENV=development`
   - `PORT=3001`
   - `DB_TYPE=sqlite`
   - `USE_REDIS_MOCK=true`

4. **Start Backend Services**
   ```bash
   cd services/clinical-service
   npm install
   npm run start:dev
   ```

5. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Seed Demo Data**
   Visit: `http://localhost:3001/api/v1/auth/seed`

### Accessing the Application
- **URL**: http://localhost:5173
- **Demo Login**: Use "Use Demo Account" button
- **Manual Login**: Use seeded credentials (see User Roles section)

---

## 👥 User Roles and Permissions

RSM HMS supports multiple user roles with specific capabilities and access levels.

### 1. System Administrator (`hospital_admin`)
**Capabilities:**
- Full system access and configuration
- User management (create, edit, deactivate users)
- System settings and customization
- Audit log access
- Multi-tenant management

**Demo Credentials:**
- Email: `admin@hms.local`
- Password: `admin123`

**Key Workflows:**
- User onboarding and role assignment
- System configuration and maintenance
- Security policy management
- Compliance reporting

### 2. Physician/Doctor (`doctor`)
**Capabilities:**
- Patient consultation and charting
- Order entry (labs, imaging, medications)
- Prescription writing
- Clinical decision support access
- Patient history review
- Discharge planning

**Demo Credentials:**
- Email: `doctor@hms.local`
- Password: `doctor123`

**Key Workflows:**
- Daily patient rounds
- New patient consultations
- Medication reconciliation
- Diagnostic ordering
- Care plan documentation

### 3. Nurse (`nurse`)
**Capabilities:**
- Vital signs recording
- Medication administration (BCMA)
- Patient monitoring
- Care coordination
- Patient education
- Discharge instructions

**Demo Credentials:**
- Email: `nurse@hms.local`
- Password: `nurse123`

**Key Workflows:**
- Shift handoffs
- Medication administration
- Patient assessment
- Care planning
- Patient monitoring

### 4. Receptionist/Front Desk (`receptionist`)
**Capabilities:**
- Patient registration and check-in
- Appointment scheduling
- Queue management
- Patient information updates
- Basic billing inquiries

**Demo Credentials:**
- Email: `receptionist@hms.local`
- Password: `receptionist123`

**Key Workflows:**
- Walk-in patient registration
- Appointment booking
- Check-in/check-out process
- Patient information updates

### 5. Billing/Finance Staff (`billing`)
**Capabilities:**
- Invoice generation and management
- Insurance claims processing
- Payment processing
- Financial reporting
- Account reconciliation

**Demo Credentials:**
- Email: `billing@hms.local`
- Password: `billing123`

**Key Workflows:**
- Daily billing operations
- Insurance claims submission
- Payment posting
- Financial reconciliation

### 6. Patient (`patient`)
**Capabilities:**
- View personal health records
- Schedule appointments
- Access test results
- Communicate with care team
- Update personal information

**Demo Credentials:**
- Email: `patient@hms.local`
- Password: `patient123`

**Key Workflows:**
- Appointment scheduling
- Health record access
- Test result review
- Care team communication

---

## 🩺 Clinical Workflows

### Patient Registration Process

1. **Access Registration**
   - Navigate to "Quick Register" in sidebar
   - Or use Command Palette (Ctrl+K) → "Register"

2. **Enter Patient Information**
   - Full Name (required)
   - Date of Birth (required)
   - Gender (required)
   - Mobile Number (required)
   - Email (optional)
   - Address (optional)
   - Emergency Contact (optional)

3. **Department Selection**
   - Choose appropriate department
   - System assigns priority based on department

4. **Complete Registration**
   - Click "Complete Registration"
   - System generates unique MRN (Medical Record Number)
   - Patient added to department queue

### Physician Consultation Workflow

1. **Access Patient Queue**
   - Login as physician
   - View dashboard with patient queue
   - Click on next patient

2. **Patient Workspace Overview**
   - **Left Panel**: Patient demographics, allergies, medications, recent vitals
   - **Center Panel**: Clinical notes, assessment, plan
   - **Right Panel**: Orders, prescriptions, test results

3. **Clinical Assessment**
   - Review patient history
   - Document chief complaint
   - Perform physical examination
   - Record assessment and plan

4. **Order Entry**
   - Search for labs, imaging, or procedures
   - Select appropriate tests
   - Add clinical justification
   - Submit orders

5. **Prescription Writing**
   - Search medication database
   - Select drug, dose, frequency
   - Check for drug interactions
   - Print or send electronically

6. **Documentation Completion**
   - Sign clinical note
   - Update patient status
   - Schedule follow-up if needed

### Nursing Care Workflow

1. **Daily Shift Start**
   - Review assigned patients
   - Check pending tasks
   - Review care plans

2. **Patient Rounds**
   - Assess patient condition
   - Record vital signs
   - Update care plan
   - Document interventions

3. **Medication Administration**
   - Review medication orders
   - Perform 5 Rights check:
     - Right patient
     - Right medication
     - Right dose
     - Right route
     - Right time
   - Document administration
   - Monitor for adverse reactions

4. **Patient Education**
   - Review discharge instructions
   - Educate on medications
   - Answer patient questions
   - Document teaching

### Diagnostic Workflow

1. **Order Processing**
   - Receive orders from physicians
   - Prepare patient for procedure
   - Perform diagnostic test

2. **Result Entry**
   - Enter test results
   - Review for critical values
   - Flag abnormal results

3. **Result Verification**
   - Physician reviews results
   - Discuss findings with patient
   - Update treatment plan

---

## ⚙️ Administrative Functions

### User Management

1. **Access User Management**
   - Login as System Administrator
   - Navigate to "User Management"

2. **Create New User**
   - Click "Add User"
   - Enter user details
   - Assign role and permissions
   - Set temporary password

3. **Edit User Permissions**
   - Select user from list
   - Modify role assignments
   - Update access permissions
   - Save changes

### System Configuration

1. **Access Settings**
   - Navigate to "System Settings"
   - Configure hospital information
   - Set operational parameters

2. **Department Setup**
   - Add/edit departments
   - Configure workflows
   - Set access permissions

### Audit and Compliance

1. **Access Audit Logs**
   - Navigate to "Audit Logs"
   - Filter by date, user, action
   - Export reports

2. **Compliance Reporting**
   - Generate HIPAA compliance reports
   - Review access logs
   - Monitor system usage

---

## 💰 Financial Operations

### Billing Process

1. **Invoice Generation**
   - System auto-generates invoices from clinical activities
   - Review charges for accuracy
   - Add additional services if needed

2. **Payment Processing**
   - Accept payments (cash, card, insurance)
   - Post payments to patient account
   - Generate receipts

3. **Insurance Claims**
   - Submit claims electronically
   - Track claim status
   - Handle denials and appeals

### Revenue Cycle Management

1. **Dashboard Overview**
   - View accounts receivable
   - Monitor claim status
   - Track payment trends

2. **Collections Management**
   - Identify overdue accounts
   - Send payment reminders
   - Process write-offs

---

## 🔧 System Administration

### Backup and Recovery

1. **Database Backup**
   - Automated daily backups
   - Manual backup option
   - Offsite storage

2. **System Recovery**
   - Restore from backup
   - Data validation
   - System testing

### Performance Monitoring

1. **System Health**
   - Monitor server performance
   - Database query performance
   - API response times

2. **User Activity**
   - Track concurrent users
   - Monitor resource usage
   - Generate usage reports

---

## 🚀 Advanced Features

### Command Palette (Ctrl+K)
- Global search and navigation
- Quick action triggers
- Patient search and access

### Real-time Notifications
- Critical lab results
- Patient status changes
- System alerts

### Mobile Access
- Responsive design for tablets
- Mobile-optimized workflows
- Offline capability (limited)

### Integration Capabilities
- HL7/FHIR APIs
- Third-party system integration
- Data export/import

---

## 🔍 Troubleshooting

### Common Issues

**Login Problems**
- Verify credentials are correct
- Check account status (not deactivated)
- Clear browser cache

**Slow Performance**
- Check internet connection
- Clear browser cache
- Contact IT support

**Data Not Saving**
- Check form validation
- Verify required fields
- Contact system administrator

### Support Resources

- **User Manual**: This document
- **Help Desk**: support@hms.local
- **Training Videos**: Available in system
- **API Documentation**: http://localhost:3001/api/docs

---

## 📡 API Reference

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/seed` - Seed demo data (dev only)

### Patient Management
- `GET /api/v1/patients` - List patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/:id` - Get patient details
- `PUT /api/v1/patients/:id` - Update patient

### Clinical Operations
- `GET /api/v1/encounters` - List encounters
- `POST /api/v1/encounters` - Create encounter
- `GET /api/v1/vitals` - Get vitals
- `POST /api/v1/vitals` - Record vitals

### Administrative
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/settings` - Get system settings

For complete API documentation, visit: http://localhost:3001/api/docs

---

## 📞 Contact Information

- **Technical Support**: tech-support@hms.local
- **Clinical Support**: clinical-support@hms.local
- **Billing Support**: billing-support@hms.local
- **Emergency Hotline**: 1-800-HMS-HELP

---

*This documentation is maintained by the RSM HMS development team. Last updated: May 7, 2026*</content>
<parameter name="filePath">c:\Users\SARAGI\.gemini\antigravity\scratch\next-gen-hms\APPLICATION_DOCUMENTATION.md