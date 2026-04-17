import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class Department {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    name: string

    @Column({ nullable: true })
    cost_center: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    // Der Abteilungsleiter
    @ManyToOne(() => User, (user) => user.ledDepartments, {
        nullable: true, // Falls eine Abteilung temporär keinen Leiter hat
        onDelete: 'SET NULL' // Wenn der User gelöscht wird, bleibt die Abteilung bestehen
    })
    @JoinColumn({ name: 'head_id' }) // Optional: Benennt die Spalte in der DB explizit
    head: User;

    // Self-referencing for Hierarchy
    @ManyToOne(() => Department, department => department.children, { nullable: true })
    parent: Department

    @OneToMany(() => Department, department => department.parent)
    children: Department[]

    // N User in einer Abteilung
    @OneToMany(() => User, user => user.department)
    users: User[]
}