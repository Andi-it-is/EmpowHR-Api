// entity/Document.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { User } from "./User"
import { DocumentSecurityLevel, DocumentType } from "../lib/enums/acessControl.enum"

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

    // Zugriffskontrolle für fremde User (i.e. nicht-besitzer des Dokuments). 
    // Besitzer des Dokumentes ignorieren in der API Logik dieses max_level. 
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