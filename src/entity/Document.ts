// entity/Document.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { User } from "./User"
import { DocumentSecurityLevel, DocumentType } from "../lib/enums/rolesPermissionsDocuments.enum"

@Entity()
export class Document {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    title: string

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: false
    })
    type: DocumentType

    @Column({
        type: 'enum',
        enum: DocumentSecurityLevel,
        nullable: false,
        default: DocumentSecurityLevel.RESTRICTED
    })
    security_level: DocumentSecurityLevel

    @Column({ nullable: false })
    file_path: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => User, user => user.documents, { onDelete: 'CASCADE' })
    user: User
}