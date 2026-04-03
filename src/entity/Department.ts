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

    // Self-referencing for Hierarchy
    @ManyToOne(() => Department, department => department.children, { nullable: true })
    parent: Department

    @OneToMany(() => Department, department => department.parent)
    children: Department[]

    // N User in einer Abteilung
    @OneToMany(() => User, user => user.department)
    users: User[]
}