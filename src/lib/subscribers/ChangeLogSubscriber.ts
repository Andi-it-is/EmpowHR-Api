import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm"
import { ChangeLogHistory } from "../../entity/ChangeLogHistory"
import { ExistingDatabaseTableNames, ChangeLogAction } from "../enums/acessControl.enum"

@EventSubscriber()
export class ChangeLogSubscriber implements EntitySubscriberInterface {

    // ! Fill with more sensitive Fields, that need to be explicitly removed from the ChangeLogSubscriber
    private readonly sensitiveFields = [
        'password_hash',
        'password',
        'id',
        'created_at',
        'updated_at'
    ]

    private deletePath(obj: any, path: string): void {
        const keys = path.split('.')
        const lastKey = keys.pop()!
        const target = keys.reduce((acc, key) => acc?.[key], obj)
        if (target && lastKey in target) delete target[lastKey]
    }

    private sanitize(data: any): any {
        if (!data) return null
        const sanitized = JSON.parse(JSON.stringify(data)) // deep clone
        this.sensitiveFields.forEach(field => this.deletePath(sanitized, field))
        return sanitized
    }

    private readonly watchedTables: ExistingDatabaseTableNames[] = [
        ExistingDatabaseTableNames.USER,
        ExistingDatabaseTableNames.USER_MASTER_DATA,
        ExistingDatabaseTableNames.ROLE,
        ExistingDatabaseTableNames.PERMISSION,
        ExistingDatabaseTableNames.DEPARTMENT,
    ]

    // Alle Entitäten beobachten. Später aus der Whitelist filtern
    listenTo() {
        return Object
    }

    async afterInsert(event: InsertEvent<any>) {
        if (!this.watchedTables.includes(event.metadata.tableName as ExistingDatabaseTableNames)) return
        await this.log(event, ChangeLogAction.CREATE, null, event.entity)
    }

    async afterUpdate(event: UpdateEvent<any>) {
        if (!this.watchedTables.includes(event.metadata.tableName as ExistingDatabaseTableNames)) return
        await this.log(event, ChangeLogAction.UPDATE, event.databaseEntity, event.entity)
    }

    async afterRemove(event: RemoveEvent<any>) {
        if (!this.watchedTables.includes(event.metadata.tableName as ExistingDatabaseTableNames)) return
        await this.log(event, ChangeLogAction.DELETE, event.databaseEntity, null)
    }

    private async log(
        event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
        action: ChangeLogAction,
        oldValue: any,
        newValue: any
    ) {
        // ChangeLogHistory selbst nicht loggen → infinite loop
        if (event.metadata.tableName === 'change_log_history') return

        const tableName = event.metadata.tableName as ExistingDatabaseTableNames

        const log = new ChangeLogHistory()
        log.entity_table_name = tableName
        log.entity_id = event.entity?.id ?? oldValue?.id
        log.action = action
        log.old_value = this.sanitize(oldValue) ?? null
        log.new_value = this.sanitize(newValue) ?? null
        log.changed_by = event.queryRunner?.data?.currentUser ?? {
            id: 'Direkter Admin Zugriff',
            first_name: 'System',
            last_name: 'System'
        }

        await event.manager.save(ChangeLogHistory, log)
    }
}