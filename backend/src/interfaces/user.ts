export type User = {
  name: string;
  email: string;
  password?: string;
  profileImage: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: Date;
  purchases: {
    books: Array<{ bookId: string }>;
    courses: Array<{ courseId: string }>;
  };
  googleId?: string;
  facebookId?: string;
};

export enum Role {
  User = "user",
  Admin = "admin",
  Moderator = "moderator",
}