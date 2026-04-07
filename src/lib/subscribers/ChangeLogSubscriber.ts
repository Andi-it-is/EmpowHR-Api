import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm"
import { ChangeLogHistory } from "../../entity/ChangeLogHistory"
import { ExistingDatabaseTableNames, ChangeLogAction } from "../enums/acessControl.enum"
import { requestContext } from "../middleware/dbRequestContext"

@EventSubscriber()
export class ChangeLogSubscriber implements EntitySubscriberInterface {

    //! Felder, die niemals im Log erscheinen dürfen
    private readonly sensitiveFields = [
        'password_hash',
        'password',
        'id',
        'created_at',
        'updated_at',
        'failed_login_attempts'
    ]

    private readonly watchedTables: ExistingDatabaseTableNames[] = [
        ExistingDatabaseTableNames.USER,
        ExistingDatabaseTableNames.USER_MASTER_DATA,
        ExistingDatabaseTableNames.ROLE,
        ExistingDatabaseTableNames.PERMISSION,
        ExistingDatabaseTableNames.DEPARTMENT,
    ]

    listenTo() {
        return Object
    }

    /**
     * Bereinigt Daten: Entfernt sensitive Felder und reduziert 
     * Relationen (Objekte) auf ihre ID.
     */
    private sanitize(data: any): any {
        if (!data) return null
        // Deep Clone, um das Original-Entity nicht zu manipulieren
        const sanitized = JSON.parse(JSON.stringify(data))

        const cleanRecursive = (obj: any) => {
            if (!obj || typeof obj !== 'object') return

            Object.keys(obj).forEach(key => {
                // 1. Sensitive Felder löschen
                if (this.sensitiveFields.includes(key)) {
                    delete obj[key]
                    return
                }

                // 2. Relationen flach halten (nur ID behalten)
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    if (obj[key].id) {
                        obj[key] = { id: obj[key].id }
                    } else {
                        // Objekt ohne ID (z.B. leeres Profil) entfernen
                        delete obj[key]
                    }
                }
            })
        }

        cleanRecursive(sanitized)
        return sanitized
    }

    /**
     * Vergleicht Alt und Neu und gibt nur die Differenz zurück.
     */
    private getDelta(oldVal: any, newVal: any): any {
        if (!oldVal) return newVal
        if (!newVal) return null

        const delta: any = {}
        let hasChanges = false

        Object.keys(newVal).forEach(key => {
            // Falls Key in sensitiveFields, ignorieren
            if (this.sensitiveFields.includes(key)) return

            const oldSub = oldVal[key]
            const newSub = newVal[key]

            // Vergleich von Relationen (Objekte mit IDs)
            if (newSub && typeof newSub === 'object' && !Array.isArray(newSub)) {
                if (oldSub?.id !== newSub?.id) {
                    delta[key] = newSub
                    hasChanges = true
                }
                return
            }

            // Vergleich von primitiven Werten
            if (JSON.stringify(oldSub) !== JSON.stringify(newSub)) {
                delta[key] = newSub
                hasChanges = true
            }
        })

        return hasChanges ? delta : null
    }

    async afterInsert(event: InsertEvent<any>) {
        if (!this.isWatched(event)) return
        await this.log(event, ChangeLogAction.CREATE, null, this.sanitize(event.entity))
    }

    async afterUpdate(event: UpdateEvent<any>) {
        if (!this.isWatched(event)) return

        const oldSanitized = this.sanitize(event.databaseEntity)
        const newPayloadSanitized = this.sanitize(event.entity)

        // Berechne nur die tatsächlichen Änderungen
        const delta = this.getDelta(oldSanitized, newPayloadSanitized)

        if (delta) {
            // Für ein sauberes "Old Value" Log reduzieren wir das alte Objekt 
            // auf genau die Keys, die sich geändert haben.
            const relevantOldData: any = {}
            Object.keys(delta).forEach(key => {
                relevantOldData[key] = oldSanitized[key]
            })

            await this.log(event, ChangeLogAction.UPDATE, relevantOldData, delta)
        }
    }

    async afterRemove(event: RemoveEvent<any>) {
        if (!this.isWatched(event)) return
        await this.log(event, ChangeLogAction.DELETE, this.sanitize(event.databaseEntity), null)
    }

    private isWatched(event: any): boolean {
        return this.watchedTables.includes(event.metadata.tableName as ExistingDatabaseTableNames)
    }

    private async log(
        event: any,
        action: ChangeLogAction,
        oldValue: any,
        newValue: any
    ) {
        if (event.metadata.tableName === 'change_log_history') return

        const log = new ChangeLogHistory()
        log.entity_table_name = event.metadata.tableName as ExistingDatabaseTableNames
        log.entity_id = event.entity?.id ?? event.databaseEntity?.id
        log.action = action
        log.old_value = oldValue
        log.new_value = newValue

        const user = requestContext.getStore()?.currentUser
        log.changed_by = user
            ? { id: user.id, first_name: user.firstname, last_name: user.lastname }
            : { id: 'system', first_name: 'System', last_name: 'System' }       // fallback


        await event.manager.save(ChangeLogHistory, log)
    }
}