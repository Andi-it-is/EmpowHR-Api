import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Token } from "./Token"

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    firstname: string

    @Column({ nullable: false })
    lastname: string

    @Column({ unique: true })
    email: string

    @Column({ nullable: false, select: false })
    password_hash: string

    @Column({ default: false })
    disabled: boolean

    @Column({ default: 0 })
    failed_login_attempts: number

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;


    @OneToMany(() => Token, token => token.user)
    token: Token[];

}
