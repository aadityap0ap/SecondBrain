import {z} from "zod";

export const userSchema = z.object({
    username : z.string().
    min(3,"Username must contain at least 3 characters").
    max(10,"Username must be atmost 10 characters").
    regex(/^[A-Za-z]+$/, "Username must contain only letters"),

    password : z.string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
})

