import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordSalt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, passwordSalt);

    try {
      // Create user with transaction
      return await this.usersRepository.executeTransaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            email: createUserDto.email,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            role: 'USER',
            auth: {
              create: {
                password: hashedPassword,
                passwordSalt,
                passwordHashVersion: 1,
              },
            },
            contactInfo: {
              create: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                phone: createUserDto.phone,
              },
            },
          },
        });

        // Create default preferences
        await prisma.userPreference.create({
          data: {
            userId: user.id,
            currencyId: createUserDto.currencyId || 'usd', // default currency
            languageId: createUserDto.languageId || 'en', // default language
            themeId: createUserDto.themeId || 'light', // default theme
          },
        });

        return user;
      });
    } catch (error) {
      // Handle specific database errors
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id); // Check if user exists

    return this.usersRepository.update(id, {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      contactInfo: {
        update: {
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          phone: updateUserDto.phone,
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id); // Check if user exists
    return this.usersRepository.delete(id);
  }
} 