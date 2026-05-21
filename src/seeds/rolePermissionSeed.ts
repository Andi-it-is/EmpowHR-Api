// src/seeds/rolePermissionSeed.ts

import { AppDataSource } from "../AppDataSource"
import { Role } from "../entity/Role"
import { Permission } from "../entity/Permission"
import { RoleName, DocumentSecurityLevel, PermissionAction, PermissionScope, ExistingEntityNames } from "../lib/enums/acessControl.enum"
import { Department } from "../entity/Department"
import { DepartmentName } from "../lib/enums/acessControl.enum"


/**
 ** A Seeder is a once-fill-in Script that fills hardcoded db entries into the database
 ** used to create permissions and roles, since they exist as is.
 ** For our Usecase, we have 13 Entities in the db.
 */
const permissions = [

  // Certificate
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.CERTIFICATE, action, scope
    }))
  ),

  // Department
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.DEPARTMENT, action, scope
    }))
  ),

  // Department
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.DOCUMENT, action, scope
    }))
  ),

  // TimeEntry
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.TIME_ENTRY, action, scope
    }))
  ),

  // Token
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.TOKEN, action, scope
    }))
  ),

  // User
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.USER, action, scope
    }))
  ),

  // UserMasterData
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.USER_MASTER_DATA, action, scope
    }))
  ),

  // UserTimeAccount
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.USER_TIME_ACCOUNT, action, scope
    }))
  ),

  // Rollen
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.ROLE, action, scope
    }))
  ),

  // Berechtigungen
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.PERMISSION, action, scope
    }))
  ),

  // Locations / Standorte
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.LOCATION, action, scope
    }))
  ),

  // Buchbare Ressource. Tisch/Räume
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.BOOKABLE_RESSOURCE, action, scope
    }))
  ),

  // Eintrag für Buchbare Ressourcen
  ...Object.values(PermissionAction).flatMap(action =>
    Object.values(PermissionScope).map(scope => ({
      entity: ExistingEntityNames.BOOKING_RESSOURCE_ENTRY, action, scope
    }))
  ),
]

const roles: { name: RoleName, max_security_level: DocumentSecurityLevel, scope: PermissionScope }[] = [

  { name: RoleName.EMPLOYEE, max_security_level: DocumentSecurityLevel.CONFIDENTIAL, scope: PermissionScope.SELF },
  { name: RoleName.DEPARTMENT_HEAD, max_security_level: DocumentSecurityLevel.SECRET, scope: PermissionScope.SUBORDINATE },
  { name: RoleName.HR_MANAGER, max_security_level: DocumentSecurityLevel.TOP_SECRET, scope: PermissionScope.ALL },
  { name: RoleName.ACCOUNTANT, max_security_level: DocumentSecurityLevel.SECRET, scope: PermissionScope.DEPARTMENT },

  { name: RoleName.DEMO, max_security_level: DocumentSecurityLevel.RESTRICTED, scope: PermissionScope.DEPARTMENT },

  { name: RoleName.IT_ADMINISTRATOR, max_security_level: DocumentSecurityLevel.CONFIDENTIAL, scope: PermissionScope.ALL },
  { name: RoleName.EXECUTIVE, max_security_level: DocumentSecurityLevel.CONFIDENTIAL, scope: PermissionScope.ALL },
]


const departments: { name: DepartmentName, cost_center: string }[] = [
  { name: DepartmentName.EXECUTIVE, cost_center: 'CX_1000' },
  { name: DepartmentName.LEGAL, cost_center: 'CX_2000' },
  { name: DepartmentName.FINANCE, cost_center: 'CX_3000' },
  { name: DepartmentName.IT, cost_center: 'CX_4000' },
  { name: DepartmentName.HR, cost_center: 'CX_5000' },
  { name: DepartmentName.MARKETING, cost_center: 'CX_6000' },
  { name: DepartmentName.SALES, cost_center: 'CX_7000' },
]

async function seed() {
  await AppDataSource.initialize()
  console.log('🌱 Seeding gestartet...')

  const permissionRepo = AppDataSource.getRepository(Permission)
  const roleRepo = AppDataSource.getRepository(Role)

  // Permissions upserten
  console.log('📋 Permissions werden eingefügt...')
  const savedPermissions: Permission[] = []

  for (const p of permissions) {
    let existing = await permissionRepo.findOne({ where: { entity: p.entity, action: p.action, scope: p.scope } })
    if (!existing) {
      existing = await permissionRepo.save(permissionRepo.create(p))
      console.log(`  ✓ ${p.entity} · ${p.action} · ${p.scope}`)
    } else {
      console.log(`  – ${p.entity} · ${p.action} · ${p.scope} (bereits vorhanden)`)
    }
    savedPermissions.push(existing)
  }

  // Roles upserten
  console.log('\n👥 Rollen werden eingefügt...')
  for (const r of roles) {
    const existing = await roleRepo.findOne({ where: { name: r.name } })
    if (!existing) {
      await roleRepo.save(roleRepo.create(r))
      console.log(`  ✓ ${r.name}`)
    } else {
      console.log(`  – ${r.name} (bereits vorhanden)`)
    }
  }

  // Departments upserten
  console.log('\n🏢 Departments werden eingefügt...')
  const departmentRepo = AppDataSource.getRepository(Department)

  for (const d of departments) {
    const existing = await departmentRepo.findOne({ where: { name: d.name } })
    if (!existing) {
      await departmentRepo.save(departmentRepo.create(d))
      console.log(`  ✓ ${d.name}`)
    } else {
      console.log(`  – ${d.name} (bereits vorhanden)`)
    }
  }

  console.log('\n✅ Seeding abgeschlossen.')
  await AppDataSource.destroy()
}

seed().catch(err => {
  console.error('❌ Seed fehlgeschlagen:', err)
  process.exit(1)
})