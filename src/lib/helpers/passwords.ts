import * as bcrypt from "bcryptjs";

export async function hash(input: string): Promise<string> {

    return bcrypt.hash(input, 8);

}

export async function compare(input: string, hash: string): Promise<boolean> {

    return bcrypt.compare(input, hash);

}