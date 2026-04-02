import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { User } from "./User"

@Entity()
export class Certificate {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  title: string

  @Column({ nullable: true })
  description: string

  @Column({ nullable: false })
  file_path: string

  @Column({ nullable: true })
  issued_at: Date

  @Column({ nullable: true })
  expires_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => User, user => user.certificates, { onDelete: 'CASCADE' })
  user: User
}