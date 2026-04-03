// entity/Role.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm"
import { RoleName, DocumentSecurityLevel } from "../lib/enums/acessControl.enum"
import { Permission } from "./Permission"
import { User } from "./User"

@Entity()
export class Role {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'enum',
        enum: RoleName,
        nullable: false,
        unique: true
    })
    name: RoleName

    @Column({
        type: 'int',
        nullable: false,
        default: DocumentSecurityLevel.RESTRICTED
    })
    max_security_level: DocumentSecurityLevel

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToMany(() => Permission, permission => permission.roles)
    @JoinTable()
    permissions: Permission[]

    @ManyToMany(() => User, user => user.roles)
    users: User[]
}