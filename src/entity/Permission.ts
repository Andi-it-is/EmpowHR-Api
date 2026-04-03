// entity/Permission.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm"
import { ExistingEntityNames, PermissionAction, PermissionScope } from "../lib/enums/acessControl.enum"
import { Role } from "./Role"

@Entity()
export class Permission {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    entity: ExistingEntityNames

    @Column({
        type: 'enum',
        enum: PermissionAction,
        nullable: false
    })
    action: PermissionAction

    @Column({
        type: 'enum',
        enum: PermissionScope,
        nullable: false
    })
    scope: PermissionScope

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[]
}