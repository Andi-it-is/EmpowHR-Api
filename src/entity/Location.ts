import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"

@Entity()
export class Location {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    name: string

    @Column({ nullable: false })
    street: string

    @Column({ nullable: false })
    zipcode: string

    @Column({ nullable: false })
    city: string

    @Column({ nullable: false })
    country: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}