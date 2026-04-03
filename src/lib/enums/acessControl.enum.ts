
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
  SECRET = 3,                // Geheim — ich, HR, Chef
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


/**
 * User mit all seinen Rollen
 * SELECT *
    FROM public.user u
    LEFT JOIN user_roles_role urr ON u.id = urr."userId"
    LEFT JOIN role r ON r.id = urr."roleId"
    WHERE u.id = 'f13ccdb4-be5f-4d16-800b-b51ad1cac1cd';
 */

/**
 * Rolle mit all seinen Usern.
 * SELECT * 
    FROM role r
    LEFT JOIN user_roles_role urr ON r.id = urr."roleId"
    LEFT JOIN "user" u ON u.id = urr."userId"
    WHERE r.id = '079c1539-377c-49c2-9302-487710a266d9';
 */

/**
 * Rolle mit all seinen Permissions
 * SELECT
    r.id AS role_id,
    r.name AS role_name,
    r.max_security_level,
    p.id AS permission_id,
    p.entity,
    p.action,
    p.scope
    FROM role r
    LEFT JOIN role_permissions_permission rpp ON r.id = rpp."roleId"
    LEFT JOIN permission p ON p.id = rpp."permissionId"
    WHERE r.id = 'myString';
 */

/**
 * Permission, die in all diesen Rollen vorhanden ist.
 * 
 * SELECT
    p.id AS permission_id,
    p.entity,
    p.action,
    p.scope,
    r.id AS role_id,
    r.name AS role_name,
    r.max_security_level
    FROM permission p
    LEFT JOIN role_permissions_permission rpp ON p.id = rpp."permissionId"
    LEFT JOIN role r ON r.id = rpp."roleId"
    WHERE p.id = 'myString';
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

