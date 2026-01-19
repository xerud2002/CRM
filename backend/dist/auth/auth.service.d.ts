import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}
export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
}
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<User | null>;
    login(email: string, password: string): Promise<LoginResponse>;
    createUser(email: string, password: string, name: string, role?: UserRole): Promise<User>;
    findById(id: string): Promise<User | null>;
}
