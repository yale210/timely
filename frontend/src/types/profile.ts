/**
 * Represents a user profile.
 * @interface Profile
 */
export interface Profile {
  name: string;
  date_of_birth: string | null;
  creation_date: string;
  slogan: string;
  bio: string;
  avatar: string | null;
}

/**
 * Represents a public profile view.
 * @interface PublicProfile
 */
export interface PublicProfile {
  username: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  joined_at: string;
}