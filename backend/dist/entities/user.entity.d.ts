export declare enum UserRole {
    ADMIN = "admin",
    STAFF = "staff"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    leads: any[];
    activities: any[];
    assessments: any[];
    createdAt: Date;
    updatedAt: Date;
}
