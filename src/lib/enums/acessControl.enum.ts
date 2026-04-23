
export enum DocumentType {
  CONTRACT = 'CONTRACT',            // Vertrag
  FINANCE = 'FINANCE',              // Finanzen / Lohnabrechnung
  ABSENCE = 'ABSENCE',              // Abwesenheit / Krankmeldung
  QUALIFICATION = 'QUALIFICATION',  // Qualifikation
  COMPLIANCE = 'COMPLIANCE'         // Compliance
}

// Ein einzelnes Dokument hat ein Securitylevel
export enum DocumentSecurityLevel {
  RESTRICTED = 1,            // Dienstgebrauch — alle im Unternehmen
  CONFIDENTIAL = 2,          // Vertraulich — nur Abteilung
  SECRET = 3,                // Geheim — ich, HR, Chef, Buchhaltung
  TOP_SECRET = 4             // Sehr Geheim — nur ich und HR
}

// Permission Scope ist dafür da, um den Zugriff von Nicht-Besitzern auf Dokumente zu regulieren.
// Kann
export enum PermissionScope {
  ALL = 'ALL',                  // Alle - äquivalent zu DocumentSecurityLevel.RESTRICTED  
  DEPARTMENT = 'DEPARTMENT',    // Gesamte Abteilung - äquivalent zu DocumentSecurityLevel.CONFIDENTIAL  
  SUBORDINATE = 'SUBORDINATE',  // Untergebene - äquivalent zu DocumentSecurityLevel.SECRET  
  SELF = 'SELF',                // Nur eigene Daten - äquivalent zu DocumentSecurityLevel.TOP_SECRET
}

// CRUD Operationen
export enum PermissionAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum ChangeLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}


export enum RoleName {
  EMPLOYEE = 'EMPLOYEE',                    // Mitarbeiter
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',      // Abteilungsleiter (Ist auch direkter Supervisor eines Mitarbeiters)
  HR_MANAGER = 'HR_MANAGER',                // Personalreferent. Erstellt auch Mitarbeiter
  ACCOUNTANT = 'ACCOUNTANT',                // Buchhaltung
  DEMO = 'DEMO',                            // Demo Account. Hat alle Permissions, aber nur read-only

  IT_ADMINISTRATOR = 'IT_ADMINISTRATOR',    // IT Admin
  EXECUTIVE = 'EXECUTIVE',                  // Geschäftsführung
}

/**
 * Keine Ahnung ob die Bewertungen gut sind ?
 * 
 * EMPLOYEE 2 — DEPARTMENT
 * DEPARTMENT_HEAD 3 — SECRET
 * HR_MANAGER 4 — TOP_SECRET
 * ACCOUNTANT 3 - SECRET
 * IT_ADMINISTRATOR 2 — CONFIDENTIAL
 * EXECUTIVE 4 — TOP_SECRET
 */

export enum ExistingEntityNames {
  CERTIFICATE = 'Certificate',
  DEPARTMENT = 'Department',
  DOCUMENT = 'Document',
  TIME_ENTRY = 'TimeEntry',
  TOKEN = 'Token',
  USER = 'User',
  USER_MASTER_DATA = 'UserMasterData',
  USER_TIME_ACCOUNT = 'UserTimeAccount',
  ROLE = 'Role',
  PERMISSION = 'Permission',
  LOCATION = 'Location',
  BOOKABLE_RESSOURCE = 'BookableRessource',
  BOOKING_RESSOURCE_ENTRY = 'BookingRessourceEntry'
}

export enum ExistingDatabaseTableNames {
  CERTIFICATE = 'certificate',
  DEPARTMENT = 'cepartment',
  DOCUMENT = 'document',
  TIME_ENTRY = 'timeEntry',
  TOKEN = 'token',
  USER = 'user',
  USER_MASTER_DATA = 'user_master_data',
  USER_TIME_ACCOUNT = 'User_time_account',
  ROLE = 'role',
  PERMISSION = 'permission',
  LOCATION = 'location',
  BOOKABLE_RESSOURCE = 'bookable_ressource',
  BOOKING_RESSOURCE_ENTRY = 'booking_ressource_entry'
}

