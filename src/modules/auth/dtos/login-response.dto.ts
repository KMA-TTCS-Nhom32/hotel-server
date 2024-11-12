// import { User } from '@/users/models';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    type: String,
  })
  accessToken: string;

  @ApiProperty({ example: 1733479330, type: Number })
  accessTokenExpires: number;

  @ApiProperty({
    example: 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    type: String,
  })
  refreshToken: string;

//   @ApiProperty({ type: User })
//   user: User;
}
