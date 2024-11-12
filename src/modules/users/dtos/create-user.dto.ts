import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        example: 'sondoannam202@gmail.com',
        description: "The user's email address.",
        type: String,
    })
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: '0123456789',
        description: "The user's phone number.",
        type: String,
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(12)
    phone: string;

    @ApiProperty({
        example: 'password-will-secret',
        description: "The user's password.",
        minLength: 6,
        type: String,
    })
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: 'Nam Son',
        description: "The user's name.",
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    // @ApiProperty({
    //     description: "The user's role.",
    //     required: true,
    //     enum: UserRole,
    //     example: UserRole.USER,
    //     type: String,
    // })
    // @IsNotEmpty()
    // @IsEnum(UserRole)
    // role: UserRole;
}