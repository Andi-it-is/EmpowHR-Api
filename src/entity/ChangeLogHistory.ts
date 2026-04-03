import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"
import { ChangeLogAction, ExistingDatabaseTableNames } from "../lib/enums/acessControl.enum"

interface ChangedBy {
    id: string
    first_name: string
    last_name: string
}

@Entity()
export class ChangeLogHistory {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'enum',
        enum: ExistingDatabaseTableNames,
        nullable: false
    })
    entity_table_name: ExistingDatabaseTableNames

    @Column({ nullable: false })
    entity_id: string

    @Column({
        type: 'enum',
        enum: ChangeLogAction,
        nullable: false
    })
    action: ChangeLogAction

    @Column({ type: 'json', nullable: true })
    old_value: Record<string, any>

    @Column({ type: 'json', nullable: true })
    new_value: Record<string, any>

    @Column({ type: 'json', nullable: false })
    changed_by: ChangedBy

    @CreateDateColumn()
    created_at: Date
}